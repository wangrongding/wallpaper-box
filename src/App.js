function App() {
  return (
    <div className="App">
      <video
        src="https://vod-progressive.akamaized.net/exp=1650748214~acl=%2Fvimeo-prod-skyfire-std-us%2F01%2F767%2F22%2F553838564%2F2619995589.mp4~hmac=6b5c28e2d04e51de8d23969a649820523c849a54b1aa53c18aa519237ee10ee6/vimeo-prod-skyfire-std-us/01/767/22/553838564/2619995589.mp4?filename=Ocean+-+74888.mp4"
        autoPlay
        loop
        muted
        style={{ width: "100%", height: "100%" }}
      ></video>
    </div>
  );
}

export default App;
