import React from 'react';
import { Card } from 'react-bootstrap';
import { FaImages, FaTimes } from 'react-icons/fa';

const ImageUpload = ({ dragActive, handleDrag, handleDrop, handleImageChange, imageError, imagePreview, removeImage }) => {
  return (
    <Card className="border mb-4">
      <Card.Header className="bg-light">
        <h5 className="mb-0"><FaImages className="me-2"/>Product Images</h5>
      </Card.Header>
      <Card.Body>
        <div className="form-group">
          <label 
            htmlFor="images" 
            className={`upload-label ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="upload-area">
              <FaImages className="upload-icon" />
              <div>Drop files here or click to browse</div>
              <small>Select multiple images (JPEG, PNG, GIF, max 4MB each)</small>
            </div>
            <input
              type="file"
              id="images"
              name="images"
              onChange={handleImageChange}
              className="file-input"
              accept="image/jpeg,image/png,image/jpg,image/gif"
              multiple
            />
          </label>
          
          {imageError && (
            <div className="error-message">
              {imageError}
            </div>
          )}
          
          {imagePreview.length > 0 && (
            <div className="image-preview-container">
              <div className="selected-files">
                <p>{imagePreview.length} file(s) selected</p>
              </div>
              <div className="image-grid">
                {imagePreview.map((preview, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={preview} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeImage(index)}
                      title="Remove image"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default ImageUpload;