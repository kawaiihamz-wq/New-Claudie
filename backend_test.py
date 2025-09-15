import requests
import sys
import json
import time
from datetime import datetime

class ClaudieAPITester:
    def __init__(self, base_url="https://multi-modal-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.conversation_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, stream=False):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, stream=stream)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                if not stream:
                    try:
                        response_data = response.json()
                        print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                        return True, response_data
                    except:
                        return True, {}
                else:
                    return True, response
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root Endpoint", "GET", "", 200)

    def test_create_conversation(self):
        """Test creating a new conversation"""
        success, response = self.run_test(
            "Create Conversation",
            "POST",
            "conversations",
            200,
            data={"title": "Test Conversation"}
        )
        if success and 'id' in response:
            self.conversation_id = response['id']
            print(f"   Created conversation ID: {self.conversation_id}")
            return True
        return False

    def test_get_conversations(self):
        """Test getting all conversations"""
        success, response = self.run_test(
            "Get Conversations",
            "GET",
            "conversations",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} conversations")
            return True
        return False

    def test_get_messages(self):
        """Test getting messages for a conversation"""
        if not self.conversation_id:
            print("❌ No conversation ID available for message test")
            return False
            
        success, response = self.run_test(
            "Get Messages",
            "GET",
            f"conversations/{self.conversation_id}/messages",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} messages")
            return True
        return False

    def test_chat_endpoint(self):
        """Test chat endpoint with streaming"""
        if not self.conversation_id:
            print("❌ No conversation ID available for chat test")
            return False

        print(f"\n🔍 Testing Chat Endpoint (Streaming)...")
        print(f"   URL: {self.api_url}/chat")
        
        self.tests_run += 1
        
        try:
            data = {
                "content": "Hello, can you tell me what 2+2 equals?",
                "conversation_id": self.conversation_id,
                "model": "gpt-4o",
                "task_type": "general"
            }
            
            response = requests.post(
                f"{self.api_url}/chat",
                json=data,
                headers={'Content-Type': 'application/json'},
                stream=True,
                timeout=30
            )
            
            if response.status_code == 200:
                print("✅ Chat endpoint responded successfully")
                print("   Streaming response:")
                
                full_response = ""
                chunk_count = 0
                
                for line in response.iter_lines():
                    if line:
                        line_str = line.decode('utf-8')
                        if line_str.startswith('data: '):
                            try:
                                data_part = json.loads(line_str[6:])
                                if data_part.get('done'):
                                    print(f"   ✅ Stream completed with message_id: {data_part.get('message_id')}")
                                    break
                                else:
                                    content = data_part.get('content', '')
                                    full_response += content
                                    chunk_count += 1
                                    if chunk_count <= 3:  # Show first few chunks
                                        print(f"   Chunk {chunk_count}: {content[:50]}...")
                            except json.JSONDecodeError:
                                continue
                
                if full_response:
                    print(f"   Full response length: {len(full_response)} characters")
                    print(f"   Response preview: {full_response[:100]}...")
                    self.tests_passed += 1
                    return True
                else:
                    print("❌ No response content received")
                    return False
            else:
                print(f"❌ Failed - Status: {response.status_code}")
                print(f"   Error: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

    def test_different_models(self):
        """Test different AI models"""
        if not self.conversation_id:
            print("❌ No conversation ID available for model test")
            return False

        models_to_test = [
            "gpt-4o",
            "claude-3-7-sonnet-20250219", 
            "gemini-2.5-pro"
        ]
        
        successful_models = 0
        
        for model in models_to_test:
            print(f"\n🔍 Testing Model: {model}")
            self.tests_run += 1
            
            try:
                data = {
                    "content": f"Say 'Hello from {model}' in exactly those words.",
                    "conversation_id": self.conversation_id,
                    "model": model,
                    "task_type": "general"
                }
                
                response = requests.post(
                    f"{self.api_url}/chat",
                    json=data,
                    headers={'Content-Type': 'application/json'},
                    stream=True,
                    timeout=20
                )
                
                if response.status_code == 200:
                    print(f"✅ {model} responded successfully")
                    successful_models += 1
                    self.tests_passed += 1
                    
                    # Read a bit of the response
                    for line in response.iter_lines():
                        if line:
                            line_str = line.decode('utf-8')
                            if line_str.startswith('data: '):
                                try:
                                    data_part = json.loads(line_str[6:])
                                    if data_part.get('done'):
                                        break
                                    elif data_part.get('content'):
                                        print(f"   Response: {data_part['content'][:50]}...")
                                        break
                                except:
                                    continue
                else:
                    print(f"❌ {model} failed - Status: {response.status_code}")
                    
            except Exception as e:
                print(f"❌ {model} failed - Error: {str(e)}")
        
        print(f"\n📊 Model Test Results: {successful_models}/{len(models_to_test)} models working")
        return successful_models > 0

    def test_task_types(self):
        """Test different task types"""
        if not self.conversation_id:
            print("❌ No conversation ID available for task type test")
            return False

        task_tests = [
            {"type": "general", "content": "What is AI?"},
            {"type": "code", "content": "Write a Python function to add two numbers"},
            {"type": "summarize", "content": "Summarize this: AI is artificial intelligence technology"},
            {"type": "review", "content": "Review this code: def add(a, b): return a + b"}
        ]
        
        successful_tasks = 0
        
        for task in task_tests:
            print(f"\n🔍 Testing Task Type: {task['type']}")
            self.tests_run += 1
            
            try:
                data = {
                    "content": task['content'],
                    "conversation_id": self.conversation_id,
                    "model": "gpt-4o",
                    "task_type": task['type']
                }
                
                response = requests.post(
                    f"{self.api_url}/chat",
                    json=data,
                    headers={'Content-Type': 'application/json'},
                    stream=True,
                    timeout=15
                )
                
                if response.status_code == 200:
                    print(f"✅ Task type '{task['type']}' working")
                    successful_tasks += 1
                    self.tests_passed += 1
                else:
                    print(f"❌ Task type '{task['type']}' failed - Status: {response.status_code}")
                    
            except Exception as e:
                print(f"❌ Task type '{task['type']}' failed - Error: {str(e)}")
        
        print(f"\n📊 Task Type Results: {successful_tasks}/{len(task_tests)} task types working")
        return successful_tasks > 0

    def test_delete_conversation(self):
        """Test deleting a conversation"""
        if not self.conversation_id:
            print("❌ No conversation ID available for delete test")
            return False
            
        success, response = self.run_test(
            "Delete Conversation",
            "DELETE",
            f"conversations/{self.conversation_id}",
            200
        )
        return success

def main():
    print("🚀 Starting Claudie AI Assistant Backend Tests")
    print("=" * 60)
    
    tester = ClaudieAPITester()
    
    # Test sequence
    tests = [
        ("Root Endpoint", tester.test_root_endpoint),
        ("Create Conversation", tester.test_create_conversation),
        ("Get Conversations", tester.test_get_conversations),
        ("Get Messages", tester.test_get_messages),
        ("Chat Endpoint", tester.test_chat_endpoint),
        ("Different Models", tester.test_different_models),
        ("Task Types", tester.test_task_types),
        ("Delete Conversation", tester.test_delete_conversation),
    ]
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            if not result:
                print(f"\n⚠️  {test_name} failed - continuing with other tests")
        except Exception as e:
            print(f"\n💥 {test_name} crashed: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 FINAL RESULTS")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    elif tester.tests_passed > tester.tests_run * 0.7:
        print("✅ Most tests passed - backend is mostly functional")
        return 0
    else:
        print("❌ Many tests failed - backend needs attention")
        return 1

if __name__ == "__main__":
    sys.exit(main())