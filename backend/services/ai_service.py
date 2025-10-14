import os
import json
import requests
from typing import List, Dict, Optional
from models import db
from models.ai_chat import AIConfig, AIProvider

class AIService:
    def __init__(self, config: AIConfig):
        self.config = config
        self.api_key = config.decrypt_api_key()
        self.provider = config.provider
        self.model_name = config.model_name
        self.max_tokens = config.max_tokens
        self.temperature = config.temperature

    def generate_response(self, messages: List[Dict], project_context: Dict = None) -> str:
        """生成AI响应"""
        try:
            # 添加项目上下文到系统消息
            if project_context:
                system_message = self._create_project_context_message(project_context)
                messages = [{"role": "system", "content": system_message}] + messages

            if self.provider == AIProvider.OPENROUTER:
                return self._call_openrouter(messages)
            elif self.provider == AIProvider.OPENAI:
                return self._call_openai(messages)
            elif self.provider == AIProvider.ANTHROPIC:
                return self._call_anthropic(messages)
            else:
                raise ValueError(f"不支持的AI提供商: {self.provider}")
        except Exception as e:
            raise Exception(f"AI服务调用失败: {str(e)}")

    def _create_project_context_message(self, project_context: Dict) -> str:
        """创建项目上下文系统消息"""
        context_parts = []

        if project_context.get('title'):
            context_parts.append(f"项目名称: {project_context['title']}")

        if project_context.get('goal'):
            context_parts.append(f"项目目标: {project_context['goal']}")

        if project_context.get('status'):
            context_parts.append(f"项目状态: {project_context['status']}")

        if project_context.get('tasks'):
            task_count = len(project_context['tasks'])
            completed_tasks = len([t for t in project_context['tasks'] if t.get('is_completed')])
            context_parts.append(f"任务进度: {completed_tasks}/{task_count} 已完成")

        if project_context.get('start_date') and project_context.get('end_date'):
            context_parts.append(f"项目周期: {project_context['start_date']} 至 {project_context['end_date']}")

        context_message = "您是一个项目管理助手。以下是当前项目的上下文信息：\n\n" + "\n".join(context_parts)
        context_message += "\n\n请基于这些信息为用户提供有用的建议和帮助。"

        return context_message

    def _call_openrouter(self, messages: List[Dict]) -> str:
        """调用OpenRouter API"""
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Project Manager AI"
        }

        payload = {
            "model": self.model_name,
            "messages": messages,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "stream": False
        }

        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()

        result = response.json()
        if 'choices' in result and len(result['choices']) > 0:
            return result['choices'][0]['message']['content']
        else:
            raise Exception("OpenRouter API返回格式错误")

    def _call_openai(self, messages: List[Dict]) -> str:
        """调用OpenAI API"""
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model_name,
            "messages": messages,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature
        }

        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()

        result = response.json()
        if 'choices' in result and len(result['choices']) > 0:
            return result['choices'][0]['message']['content']
        else:
            raise Exception("OpenAI API返回格式错误")

    def _call_anthropic(self, messages: List[Dict]) -> str:
        """调用Anthropic Claude API"""
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }

        # 转换消息格式为Claude格式
        claude_messages = []
        system_message = None

        for msg in messages:
            if msg["role"] == "system":
                system_message = msg["content"]
            else:
                claude_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })

        payload = {
            "model": self.model_name,
            "max_tokens": self.max_tokens,
            "messages": claude_messages
        }

        if system_message:
            payload["system"] = system_message

        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()

        result = response.json()
        if 'content' in result and len(result['content']) > 0:
            return result['content'][0]['text']
        else:
            raise Exception("Anthropic API返回格式错误")

    def validate_api_key(self) -> bool:
        """验证API密钥是否有效"""
        try:
            test_messages = [{"role": "user", "content": "Hello"}]
            self.generate_response(test_messages)
            return True
        except Exception:
            return False

    def get_available_models(self) -> List[str]:
        """获取当前提供商支持的模型列表"""
        if self.provider == AIProvider.OPENROUTER:
            return [
                "openai/gpt-3.5-turbo",
                "openai/gpt-4",
                "openai/gpt-4-turbo",
                "anthropic/claude-3-haiku",
                "anthropic/claude-3-sonnet",
                "anthropic/claude-3-opus",
                "google/gemini-pro"
            ]
        elif self.provider == AIProvider.OPENAI:
            return [
                "gpt-3.5-turbo",
                "gpt-4",
                "gpt-4-turbo"
            ]
        elif self.provider == AIProvider.ANTHROPIC:
            return [
                "claude-3-haiku-20240307",
                "claude-3-sonnet-20240229",
                "claude-3-opus-20240229"
            ]
        else:
            return []