import React from 'react';
import { Card, Form } from 'react-bootstrap';
import { FaTags, FaTag, FaTimes } from 'react-icons/fa';

const Categorization = ({ categories, formData, setFormData, selectedTags, setSelectedTags, removeTag }) => {
  return (
    <Card className="border mb-4">
      <Card.Header className="bg-light">
        <h5 className="mb-0"><FaTags className="me-2"/>Categories & Tags</h5>
      </Card.Header>
      <Card.Body>
        <div className="form-group">
          <label htmlFor="categories">Categories</label>
          <div className="category-selection-container">
            <div className="selected-categories">
              {formData.categories.length > 0 ? (
                categories
                  .filter(cat => formData.categories.includes(cat.id.toString()))
                  .map(cat => (
                    <div key={cat.id} className="category-chip">
                      <span>{cat.name}</span>
                      <button 
                        type="button" 
                        className="chip-remove" 
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            categories: prev.categories.filter(id => id !== cat.id.toString())
                          }))
                        }}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))
              ) : (
                <div className="no-categories">No categories selected</div>
              )}
            </div>
            
            <div className="category-dropdown">
              <select
                id="categorySelector"
                onChange={(e) => {
                  const value = e.target.value;
                  if (value && !formData.categories.includes(value)) {
                    setFormData(prev => ({
                      ...prev,
                      categories: [...prev.categories, value]
                    }));
                  }
                  e.target.value = ''; 
                }}
                className="form-control"
              >
                <option value="">+ Add category</option>
                {categories
                  .filter(cat => !formData.categories.includes(cat.id.toString()))
                  .map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>
            
            {formData.categories.length === 0 && (
              <div className="form-text error-text">Please select at least one category</div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label><FaTag /> Tags</label>
          
          <div className="tags-selection">
            <div className="tags-input-wrapper">
              <div className="input-with-icon">
                <FaTag className="input-icon" />
                <input
                  type="text"
                  placeholder="Type tags separated by commas..."
                  className="form-control tag-input-main"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      e.preventDefault();
                      const newTags = e.target.value.split(',')
                        .map(tag => tag.trim())
                        .filter(tag => tag !== '' && !selectedTags.includes(tag));
                      
                      if (newTags.length > 0) {
                        const finalTags = [...selectedTags.filter(tag => tag.trim() !== ''), ...newTags];
                        setSelectedTags(finalTags);
                        setFormData(prev => ({ ...prev, tags: finalTags }));
                      }
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="selected-tags-container">
              {selectedTags.filter(tag => tag.trim() !== '').map((tag, index) => (
                <div key={index} className="tag-chip">
                  <span>{tag}</span>
                  <button 
                    type="button" 
                    className="chip-remove"
                    onClick={() => removeTag(index)}
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
            
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default Categorization;