// FRONTEND/src/components/VideoConference.js
import React from 'react';
import {
  useHMSStore,
  selectPeers,
  selectLocalPeer
} from '@100mslive/react-sdk';

const VideoConference = () => {
  const peers = useHMSStore(selectPeers);
  const localPeer = useHMSStore(selectLocalPeer);

  return (
    <div className="video-conference">
      <div className="video-grid">
        {/* Local peer video */}
        {localPeer && (
          <div className="video-tile">
            <video
              autoPlay
              muted
              playsInline
              ref={video => {
                if (video && localPeer.videoTrack) {
                  video.srcObject = new MediaStream([localPeer.videoTrack]);
                }
              }}
            />
            <div className="peer-name">You ({localPeer.roleName})</div>
          </div>
        )}

        {/* Remote peers videos */}
        {peers
          .filter(peer => peer.id !== localPeer?.id)
          .map(peer => (
            <div key={peer.id} className="video-tile">
              <video
                autoPlay
                playsInline
                ref={video => {
                  if (video && peer.videoTrack) {
                    video.srcObject = new MediaStream([peer.videoTrack]);
                  }
                }}
              />
              <div className="peer-name">{peer.name} ({peer.roleName})</div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default VideoConference;