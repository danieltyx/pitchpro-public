import React, { useState, useEffect } from 'react';
import './Editor.css';
import { useNavigate } from 'react-router-dom';

function Editor() {
    const [content, setContent] = useState('# My Pitch Deck\n\n## Slide 1\n\nStart your presentation here...');
    const [previewHtml, setPreviewHtml] = useState('');
    const [stackedit, setStackedit] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Wait for Stackedit to be available globally
        const initStackedit = () => {
            if (window.Stackedit) {
                const stackeditInstance = new window.Stackedit();
                setStackedit(stackeditInstance);
            } else {
                // If Stackedit is not available yet, try again in 100ms
                setTimeout(initStackedit, 100);
            }
        };

        initStackedit();

        return () => {
            if (stackedit) {
                stackedit.off('fileChange');
                stackedit.off('close');
            }
        };
    }, []);

    const openStackEdit = (editor = stackedit) => {
        if (!editor) return;

        editor.openFile({
            name: 'New Pitch Deck',
            content: {
                text: content
            }
        });

        editor.on('fileChange', (file) => {
            setContent(file.content.text);
            setPreviewHtml(file.content.html);
        });

        editor.on('close', () => {
            setPreviewHtml(content);
            console.log('Editor closed, content synced');
        });
    };

    const saveDeck = () => {
        console.log('Saving deck:', content);
        alert('Deck saved successfully!');
    };

    const startPresentation = () => {
        // Convert markdown content to slides and start presentation
        const slides = content.split('## ').filter(Boolean);
        console.log('Starting presentation with', slides.length, 'slides');
        
        const encodedContent = encodeURIComponent(content);
        navigate(`/PresentationView?content=${encodedContent}`);
        
    };

    return (
        <>
            <header className="product-header">
                <button 
                    className="back-button"
                    onClick={() => navigate('/')}
                >
                    ← Back
                </button>
                <h1 className="logo">
                    <span>Pitch Pro</span>
                </h1>
            </header>

            <div className="editor-container">
                <div className="toolbar">
                    <button className="button" onClick={() => openStackEdit()}>
                        <span>📝</span> Open Editor
                    </button>
                    <button className="button save" onClick={saveDeck}>
                        <span>💾</span> Save Deck
                    </button>
                </div>

                <div className="editor">
                    <textarea
                        id="markdown-editor"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Your presentation content will appear here..."
                    />
                </div>

                <button 
                    className="button present" 
                    onClick={startPresentation}

                    
                >
                    <span>🎭</span> Start Presentation
                </button>
            </div>
        </>
    );
}

export default Editor;