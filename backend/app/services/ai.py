import os
import json
import base64
from typing import List, Dict, Any
from groq import Groq
import google.generativeai as genai

def get_groq_client():
    api_key = os.environ.get("GROQ_API_KEY")
    return Groq(api_key=api_key)

def extract_json(text: str) -> str:
    text = text.strip()
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()
    return text

def generate_recipe_recommendations(pantry_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not pantry_items:
        return []
    
    prompt = "You are a professional chef. I have the following items in my pantry:\n"
    for item in pantry_items:
        prompt += f"- {item['name']} (Quantity: {item['quantity']} {item['unit']}, Expiry: {item['expiry_date']})\n"
    
    prompt += """
Generate exactly 3 recipe recommendations focusing on items that are expiring soon or already expired.
Respond ONLY with a valid JSON array of objects.
Each object must have the following exact keys:
"name" (string)
"description" (string)
"prep_time" (string)
"difficulty" (string)
"ingredients_used" (array of strings)
"missing_ingredients" (array of strings)
"reason" (string)
"""
    try:
        client = get_groq_client()
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=1024
        )
        
        text = extract_json(response.choices[0].message.content)
        return json.loads(text)
    except Exception as e:
        print(f"Error generating recipes: {e}")
        return []

def generate_pantry_insights(stats: Dict[str, Any]) -> List[str]:
    prompt = f"""
I am managing a pantry. Here are my current stats:
Total items: {stats['total_items']}
Expiring soon (<= 7 days): {stats['expiring_soon']}
Expired: {stats['expired']}
Low stock: {stats['low_stock']}

Please generate 3 very short, actionable, and encouraging insights or tips based on these numbers. 
Return ONLY a valid JSON array of strings.
"""
    try:
        client = get_groq_client()
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=512
        )
        text = extract_json(response.choices[0].message.content)
        return json.loads(text)
    except Exception as e:
        print(f"Error generating insights: {e}")
        return [
            "Keep an eye on your expiring items.",
            "Consider making a shopping list for low stock items.",
            "Great job managing your pantry!"
        ]

def analyze_bill(image_data_base64: str, mime_type: str) -> List[Dict[str, Any]]:
    genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    prompt = """
Analyze this grocery bill. Extract the purchased items.
Return ONLY a valid JSON array of objects, with each object having:
"name" (string)
"quantity" (number)
"unit" (string, e.g., 'pcs', 'kg', 'g', 'L')
"price" (number, optional)
Do not include any extra text.
"""
    try:
        image_parts = [
            {
                "mime_type": mime_type,
                "data": image_data_base64
            }
        ]
        
        response = model.generate_content([prompt, image_parts[0]])
        text = extract_json(response.text)
        return json.loads(text)
    except Exception as e:
        print(f"Error analyzing bill: {e}")
        return []
