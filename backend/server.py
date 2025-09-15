from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, AsyncGenerator
import uuid
from datetime import datetime, timezone, timedelta
import json
from emergentintegrations.llm.chat import LlmChat, UserMessage
import jwt
import bcrypt
from email_validator import validate_email, EmailNotValidError


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Get Emergent LLM key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-this-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Security
security = HTTPBearer()

# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: str
    content: str
    role: str  # 'user' or 'assistant'
    model_used: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessageCreate(BaseModel):
    content: str
    conversation_id: str
    model: str = "gpt-4o"  # Default model
    task_type: str = "general"  # general, code, summarize, review

class Conversation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ConversationCreate(BaseModel):
    title: str = "New Chat"

# User models for authentication
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime

class AuthResponse(BaseModel):
    token: str
    user: UserResponse

# Helper function to prepare data for MongoDB
def prepare_for_mongo(data):
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
    return data

# Helper function to parse data from MongoDB
def parse_from_mongo(item):
    if isinstance(item, dict):
        for key, value in item.items():
            if isinstance(value, str) and 'T' in value:
                try:
                    item[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                except:
                    pass
    return item

# Authentication helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode = {"user_id": user_id, "exp": expire}
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**parse_from_mongo(user))
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Authentication endpoints
@api_router.post("/auth/register", response_model=AuthResponse)
async def register(user_data: UserCreate):
    try:
        # Validate email
        valid_email = validate_email(user_data.email)
        user_data.email = valid_email.email
    except EmailNotValidError:
        raise HTTPException(status_code=400, detail="Invalid email address")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    password_hash = hash_password(user_data.password)
    
    # Create user
    user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=password_hash
    )
    
    prepared_user = prepare_for_mongo(user.dict())
    await db.users.insert_one(prepared_user)
    
    # Create token
    token = create_access_token(user.id)
    
    # Return response
    user_response = UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        created_at=user.created_at
    )
    
    return AuthResponse(token=token, user=user_response)

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(login_data: UserLogin):
    # Find user
    user_doc = await db.users.find_one({"email": login_data.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user = User(**parse_from_mongo(user_doc))
    
    # Verify password
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create token
    token = create_access_token(user.id)
    
    # Return response
    user_response = UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        created_at=user.created_at
    )
    
    return AuthResponse(token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        created_at=current_user.created_at
    )

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Claudie AI Assistant is ready!"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    prepared_data = prepare_for_mongo(status_obj.dict())
    _ = await db.status_checks.insert_one(prepared_data)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**parse_from_mongo(status_check)) for status_check in status_checks]

# Chat endpoints (protected)
@api_router.post("/conversations", response_model=Conversation)
async def create_conversation(input: ConversationCreate, current_user: User = Depends(get_current_user)):
    conversation = Conversation(**input.dict())
    prepared_data = prepare_for_mongo(conversation.dict())
    prepared_data["user_id"] = current_user.id  # Associate with user
    await db.conversations.insert_one(prepared_data)
    return conversation

@api_router.get("/conversations", response_model=List[Conversation])
async def get_conversations(current_user: User = Depends(get_current_user)):
    conversations = await db.conversations.find({"user_id": current_user.id}).sort("updated_at", -1).to_list(100)
    return [Conversation(**parse_from_mongo(conv)) for conv in conversations]

@api_router.get("/conversations/{conversation_id}/messages", response_model=List[ChatMessage])
async def get_messages(conversation_id: str, current_user: User = Depends(get_current_user)):
    # Verify conversation belongs to user
    conversation = await db.conversations.find_one({"id": conversation_id, "user_id": current_user.id})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    messages = await db.messages.find({"conversation_id": conversation_id}).sort("timestamp", 1).to_list(1000)
    return [ChatMessage(**parse_from_mongo(msg)) for msg in messages]

@api_router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, current_user: User = Depends(get_current_user)):
    # Verify conversation belongs to user
    conversation = await db.conversations.find_one({"id": conversation_id, "user_id": current_user.id})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Delete conversation and all its messages
    await db.conversations.delete_one({"id": conversation_id})
    await db.messages.delete_many({"conversation_id": conversation_id})
    return {"message": "Conversation deleted successfully"}

async def get_ai_response(content: str, model: str, task_type: str, conversation_id: str) -> AsyncGenerator[str, None]:
    """Get AI response from the selected model"""
    try:
        # Prepare system message based on task type
        system_messages = {
            "general": "You are Claudie, a smart AI assistant that helps with various tasks. You are knowledgeable, helpful, and provide clear explanations.",
            "code": "You are Claudie, a coding assistant specialized in programming. Help with code generation, debugging, optimization, and code review. Always provide clean, well-commented code with explanations.",
            "summarize": "You are Claudie, an expert at summarizing content. Provide clear, concise summaries that capture the key points and important details.",
            "review": "You are Claudie, a code review specialist. Analyze code for bugs, performance issues, best practices, and suggest improvements. Provide constructive feedback."
        }
        
        system_message = system_messages.get(task_type, system_messages["general"])
        
        # Get recent conversation history for context
        recent_messages = await db.messages.find(
            {"conversation_id": conversation_id}
        ).sort("timestamp", -1).limit(10).to_list(10)
        
        # Initialize chat with appropriate model
        if model.startswith("gpt") or model.startswith("o1") or model.startswith("o3") or model.startswith("o4"):
            provider = "openai"
        elif model.startswith("claude"):
            provider = "anthropic"
        elif model.startswith("gemini"):
            provider = "gemini"
        else:
            provider = "openai"
            model = "gpt-4o"
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=conversation_id,
            system_message=system_message
        ).with_model(provider, model)
        
        # Create user message
        user_message = UserMessage(text=content)
        
        # Get response
        response = await chat.send_message(user_message)
        
        # Stream the response
        yield response
        
    except Exception as e:
        logger.error(f"Error getting AI response: {str(e)}")
        yield f"Error: {str(e)}"

@api_router.post("/chat")
async def chat_with_ai(chat_request: ChatMessageCreate, current_user: User = Depends(get_current_user)):
    try:
        # Verify conversation belongs to user
        conversation = await db.conversations.find_one({"id": chat_request.conversation_id, "user_id": current_user.id})
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Save user message
        user_message = ChatMessage(
            conversation_id=chat_request.conversation_id,
            content=chat_request.content,
            role="user"
        )
        
        prepared_user_msg = prepare_for_mongo(user_message.dict())
        await db.messages.insert_one(prepared_user_msg)
        
        # Generate AI response
        async def generate_response():
            full_response = ""
            async for chunk in get_ai_response(
                chat_request.content, 
                chat_request.model, 
                chat_request.task_type,
                chat_request.conversation_id
            ):
                full_response += chunk
                yield f"data: {json.dumps({'content': chunk, 'done': False})}\n\n"
            
            # Save assistant message
            assistant_message = ChatMessage(
                conversation_id=chat_request.conversation_id,
                content=full_response,
                role="assistant",
                model_used=chat_request.model
            )
            
            prepared_assistant_msg = prepare_for_mongo(assistant_message.dict())
            await db.messages.insert_one(prepared_assistant_msg)
            
            # Update conversation timestamp
            await db.conversations.update_one(
                {"id": chat_request.conversation_id},
                {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            
            yield f"data: {json.dumps({'content': '', 'done': True, 'message_id': assistant_message.id})}\n\n"
        
        return StreamingResponse(
            generate_response(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()