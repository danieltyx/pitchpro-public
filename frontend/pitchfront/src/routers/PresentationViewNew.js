import {useEffect, useState} from 'react'
import {Room} from "livekit-client";
import axios from 'axios';
import PresentationView from './PresentationView';

function PresentationViewNew() {
  const room = new Room();

  useEffect(() => {
    (async () => {
      const response = await axios.get('http://127.0.0.1:6767/token');
      await room.connect('wss://pitchpro-jixgd73q.livekit.cloud', response.data.token);
    })()
  }, [])

  return (
    <PresentationView room={room} />
  )
}

export default PresentationViewNew
