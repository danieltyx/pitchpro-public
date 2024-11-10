import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import './PresentationView.css';
import { Room } from "livekit-client";
import axios from 'axios';

function CombinedPresentationView() {
    const [searchParams] = useSearchParams();
    const [slides, setSlides] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [target, setTarget] = useState(null);

    useEffect(() => {
        if (room) { return; }
        const connectToRoom = async () => {
            const response = await axios.get('http://127.0.0.1:6768/token');
            const newRoom = new Room();
            await newRoom.connect('wss://pitchpro-jixgd73q.livekit.cloud', response.data.token);
            setRoom(newRoom);
        };
        connectToRoom();
    }, []);

    useEffect(() => {
        if (room) {
            const handleConnection = () => {
                console.log('Connected to the room');
                room.localParticipant.publishData(json2data({
                    type: 'init_deck',
                    content: slides.map(slide => slide.trim())
                }), { reliable: false });
            };

            const handleDisconnection = () => {
                console.log('Disconnected from the room');
            };

            room.on('connected', handleConnection);
            room.on('disconnected', handleDisconnection);

            return () => {
                room.off('connected', handleConnection);
                room.off('disconnected', handleDisconnection);
            };
        }
    }, [room]);

    useEffect(() => {
        const encodedContent = searchParams.get('content');
        if (encodedContent) {
            const decodedContent = decodeURIComponent(encodedContent);
            const slideContent = decodedContent.split('---').filter(Boolean);
            setSlides(slideContent);
            (async () => {
                if (room && room.localParticipant) {
                    await room.localParticipant.publishData(json2data({
                        type: 'init_deck',
                        content: slideContent.map(slide => slide.trim())
                    }), { reliable: false });
                }
            })();
        }
    }, [searchParams]);

    const json2data = (dataToSend) => {
        const jsonString = JSON.stringify(dataToSend);
        return new TextEncoder().encode(jsonString);
    };

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        }
    };

    const previousSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'ArrowRight' || event.key === 'Space') {
            nextSlide();
        } else if (event.key === 'ArrowLeft') {
            previousSlide();
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [currentSlide]);

    room?.on('dataReceived', async (payload) => {
        if (!room || !room.localParticipant) {
            console.error('Room or local participant is not available');
            return;
        }
        const data = new TextDecoder().decode(payload);
        const jsonData = JSON.parse(data);

        console.log(jsonData);

        switch (jsonData.type) {
            case "connection_status":
                if (jsonData.status === "connected" && slides.length > 0) {
                    await room.localParticipant.publishData(json2data({
                        type: 'init_deck',
                        content: slides.map(slide => slide.trim())
                    }), { reliable: false });
                }
                break;
            case "database":
                if (jsonData.status === "created") {
                    room.localParticipant.setMicrophoneEnabled(true);
                }
                break;
            case 'set_target':
                setTarget(jsonData.target);
                break;
            case 'set_content':
                let content = jsonData.content;
                break;
        }
    });

    useEffect(() => {
        if (target !== null && target >= 0 && target < slides.length) {
            setCurrentSlide(target);
            setTarget(null);
        }
    }, [target, slides.length]);

    return (
        (slides.length === 0) ? (
            <div className="presentation-loading">Loading presentation...</div>
        ) : (
            <div className="presentation-container" tabIndex="0">
                <button className="back-button" onClick={() => navigate(-1)}>Back</button>
                <div className="slide-frame">
                    <div className="slide-content">
                        <ReactMarkdown
                            components={{
                                h1: ({ children }) => <h1 className="slide-title">{children}</h1>,
                                h2: ({ children }) => <h2 className="slide-title">{children}</h2>,
                                h3: ({ children }) => <h3 className="slide-subtitle">{children}</h3>,
                                p: ({ children }) => <p className="slide-body">{children}</p>,
                                ul: ({ children }) => <ul className="slide-list">{children}</ul>,
                                ol: ({ children }) => <ol className="slide-list">{children}</ol>,
                            }}
                        >
                            {slides[currentSlide]}
                        </ReactMarkdown>
                    </div>
                </div>
                <div className="presentation-controls">
                    <button className="nav-button prev" onClick={previousSlide} disabled={currentSlide === 0}>←</button>
                    <div className="slide-counter">{currentSlide + 1} / {slides.length}</div>
                    <button className="nav-button next" onClick={nextSlide} disabled={currentSlide === slides.length - 1}>→</button>
                </div>
            </div>
        )
    );
}

export default CombinedPresentationView;