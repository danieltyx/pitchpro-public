import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FileUpload.css';

function FileUpload() {
    const [files, setFiles] = useState([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const navigate = useNavigate();

    const preventDefaults = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e) => {
        preventDefaults(e);
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        preventDefaults(e);
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        preventDefaults(e);
        setIsDragOver(false);
        const dt = e.dataTransfer;
        const droppedFiles = [...dt.files];
        handleFiles(droppedFiles);
    };

    const handleFileSelect = (e) => {
        const selectedFiles = [...e.target.files];
        handleFiles(selectedFiles);
    };

    const handleFiles = (uploadedFiles) => {
        const validFiles = [];
        for (const file of uploadedFiles) {
            if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
                validFiles.push(file);
            } else {
                alert('Please upload a valid Markdown (.md) file.');
            }
        }
        setFiles(validFiles);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const readFileContent = (file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            // Log the content of the Markdown file
            // console.log(content);
            // Navigate to the PresentationView with the content
            const encodedContent = encodeURIComponent(content);
            navigate(`/PresentationView?content=${encodedContent}`);
        };
        reader.readAsText(file);
    };

    const handleUpload = () => {
        if (files.length > 0) {
            readFileContent(files[0]); // Read the first valid file
        } else {
            alert('No valid Markdown file selected.');
        }
    };

    return (
        <>
            <header className="product-header">
                <h1 className="logo">
                    <span>Pitch Pro</span>
                </h1>
            </header>

            <div className="upload-container">
                <div 
                    className={`drop-zone ${isDragOver ? 'dragover' : ''}`}
                    onDrop={handleDrop}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onClick={() => document.getElementById('fileInput').click()}
                >
                    <div className="icon">📁</div>
                    <div className="drop-zone-text">Drag and drop files here</div>
                    <div>or click to select files</div>
                    <input
                        type="file"
                        className="file-input"
                        id="fileInput"
                        multiple
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                </div>
                <div id="fileList">
                    {files.map((file, index) => (
                        <div key={index} className="file-item">
                            {file.name} ({formatFileSize(file.size)})
                        </div>
                    ))}
                </div>

                <br />
                <button 
                    className="create-deck-button"
                    onClick={handleUpload}
                >
                    <span className="icon" style={{ fontSize: '1.2rem', margin: 0 }}>📂</span>
                    Create Deck from File
                </button>

                <div className="divider">
                    <span>OR</span>
                </div>

                <button 
                    className="create-deck-button"
                    onClick={() => navigate('/Editor')}
                    style={{  }}
                >
                    <span className="icon" style={{ fontSize: '1.2rem', margin: 0 }}>✨</span>
                    Create Deck from Scratch
                </button>
                        {/* add some space here */}
                <br />
                
            </div>
        </>
    );
}

export default FileUpload;