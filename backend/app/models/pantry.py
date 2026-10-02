from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True)
    
    items = relationship("PantryItem", back_populates="category")

class PantryItem(Base):
    __tablename__ = "pantry_items"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    quantity = Column(Float, default=1.0)
    unit = Column(String(20), default="pcs")
    purchase_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=True)
    min_stock_level = Column(Float, default=0.0)
    image_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    category = relationship("Category", back_populates="items")
    shopping_list_items = relationship("ShoppingListItem", back_populates="pantry_item", cascade="all, delete-orphan")

class ShoppingListItem(Base):
    __tablename__ = "shopping_list"
    id = Column(Integer, primary_key=True, index=True)
    pantry_item_id = Column(Integer, ForeignKey("pantry_items.id"), nullable=True) # Optional link to pantry item
    name = Column(String(100)) # In case it's not linked to a pantry item
    required_quantity = Column(Float, default=1.0)
    status = Column(String(20), default="pending") # pending, bought
    created_at = Column(DateTime, default=datetime.utcnow)
    
    pantry_item = relationship("PantryItem", back_populates="shopping_list_items")

class UploadedFile(Base):
    __tablename__ = "uploaded_files"
    id = Column(Integer, primary_key=True, index=True)
    s3_key = Column(String(255), unique=True, index=True)
    s3_url = Column(String(255))
    filename = Column(String(255))
    file_type = Column(String(50))
    uploaded_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    message = Column(String(255))
    type = Column(String(50)) # e.g., 'expiry', 'low_stock'
    sent_at = Column(DateTime, default=datetime.utcnow)
