import React, { useState, useEffect } from "react";
import {
  PlaylistPreferences,
  Track,
  AppStatus,
  SpotifyUser,
  GenerationResult,
} from "./types";
import {
  generateRecommendations,
  generateCoverImage,
} from "./services/geminiService";
import { spotifyAuth, spotifyApi } from "./services/spotifyService";
import TrackCard from "./components/TrackCard";
import RadarChart from "./components/RadarChart";

const GENRES = [
  "Synthwave",
  "Dark Techno",
  "Ambient",
  "Jazz Fusion",
  "Hyperpop",
  "K-Pop",
  "Metal",
  "Lo-fi",
  "Indie Sleaze",
];

const App: React.FC = () => {
  const [prefs, setPrefs] = useState<PlaylistPreferences>({
    mood: 65,
    energy: 40,
    popularity: 75,
    danceability: 30,
    acousticness: 20,
    instrumentalness: 10,
    genre: "Synthwave",
    prompt: "",
  });

  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentPlaylist, setCurrentPlaylist] =
    useState<GenerationResult | null>(null);
  const [history, setHistory] = useState<GenerationResult[]>([]);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [spotifyUser, setSpotifyUser] = useState<SpotifyUser | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);

  useEffect(() => {
    const savedHistory = localStorage.getItem("vibe_sync_history");
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const initSpotify = async () => {
      let token = spotifyAuth.getAccessToken();
      if (!token && window.location.search.includes("code=")) {
        token = await spotifyAuth.handleCallback();
      }
      if (token) setSpotifyUser(await spotifyApi.fetchProfile());
    };
    initSpotify();
  }, []);

  const handleGenerate = async () => {
    setStatus(AppStatus.GENERATING);
    setErrorMsg(null);
    try {
      // Step 1: Generate Tracks (Crucial)
      const result = await generateRecommendations(prefs);

      // Step 2: Generate Cover Image (Optional Enhancement)
      let coverBase64 = "";
      try {
        setStatus(AppStatus.GENERATING_IMAGE);
        coverBase64 = await generateCoverImage(
          result.playlistName,
          result.playlistDescription,
        );
      } catch (imgErr) {
        console.warn("Continuing without AI cover image...");
      }

      const finalResult = { ...result, coverImage: coverBase64 };

      setTracks(finalResult.tracks);
      setCurrentPlaylist(finalResult);

      // Save to History
      const newHistory = [finalResult, ...history].slice(0, 10);
      setHistory(newHistory);
      localStorage.setItem("vibe_sync_history", JSON.stringify(newHistory));

      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      setErrorMsg(err.message || "The sonic flow was interrupted.");
      setStatus(AppStatus.ERROR);
    }
  };

  const loadFromHistory = (item: GenerationResult) => {
    setCurrentPlaylist(item);
    setTracks(item.tracks);
    setStatus(AppStatus.SUCCESS);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSpotifySync = async () => {
    if (!spotifyUser) {
      spotifyAuth.login();
      return;
    }
    if (!currentPlaylist) return;

    setStatus(AppStatus.SYNCING_SPOTIFY);
    setSyncProgress(0);

    try {
      const trackUris: string[] = [];
      for (let i = 0; i < tracks.length; i++) {
        const uri = await spotifyApi.searchTrack(
          tracks[i].title,
          tracks[i].artist,
        );
        if (uri) trackUris.push(uri);
        setSyncProgress(Math.round(((i + 1) / tracks.length) * 100));
      }

      if (trackUris.length === 0)
        throw new Error("No tracks found on Spotify.");

      const url = await spotifyApi.createPlaylist(
        spotifyUser.id,
        currentPlaylist.playlistName,
        trackUris,
        currentPlaylist.playlistDescription,
        currentPlaylist.coverImage,
      );

      setStatus(AppStatus.SUCCESS);
      window.open(url, "_blank");
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus(AppStatus.ERROR);
    }
  };

  return (
    <div className="min-h-screen pb-20 selection:bg-purple-500/30">
      <nav className="sticky top-0 z-50 glass-card px-6 py-4 border-b border-purple-500/10 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg">
              <i className="fa-solid fa-bolt-lightning"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                VIBESYNC<span className="text-purple-500">.AI</span>
              </h1>
            </div>
          </div>
          {spotifyUser ? (
            <div className="flex items-center gap-3 bg-zinc-900 border border-purple-500/20 px-4 py-2 rounded-full shadow-inner">
              <span className="text-xs font-bold text-zinc-300">
                {spotifyUser.display_name}
              </span>
              <button
                onClick={() => {
                  spotifyAuth.logout();
                  setSpotifyUser(null);
                }}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
              </button>
            </div>
          ) : (
            <button
              onClick={() => spotifyAuth.login()}
              className="bg-black border border-purple-500/30 hover:border-purple-500 text-white font-bold py-2.5 px-6 rounded-full text-xs transition-all flex items-center gap-2"
            >
              <i className="fa-brands fa-spotify text-green-500"></i> Connect
              Spotify
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4 space-y-6">
          <section className="glass-card p-6 rounded-2xl shadow-xl space-y-6 border-white/5">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              Acoustic Logic
            </h2>
            <RadarChart data={prefs} />
            <textarea
              value={prefs.prompt}
              onChange={(e) => setPrefs({ ...prefs, prompt: e.target.value })}
              placeholder="Describe the aesthetic..."
              className="w-full h-24 bg-zinc-950 border border-white/5 rounded-xl p-4 text-sm focus:ring-1 focus:ring-purple-500 outline-none transition-all placeholder:text-zinc-700"
            />
            <div className="space-y-4">
              {["mood", "energy", "popularity", "danceability"].map((key) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-zinc-500">
                    <span>{key}</span>
                    <span>{prefs[key as keyof PlaylistPreferences]}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={prefs[key as keyof PlaylistPreferences]}
                    onChange={(e) =>
                      setPrefs({ ...prefs, [key]: parseInt(e.target.value) })
                    }
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => setPrefs({ ...prefs, genre: g })}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all ${prefs.genre === g ? "bg-purple-600 text-white border-purple-400" : "bg-zinc-900 text-zinc-500 border-white/5 hover:border-zinc-700"}`}
                >
                  {g}
                </button>
              ))}
            </div>
            <button
              onClick={handleGenerate}
              disabled={
                status === AppStatus.GENERATING ||
                status === AppStatus.GENERATING_IMAGE
              }
              className="w-full bg-white hover:bg-zinc-200 text-black font-black py-4 rounded-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {status === AppStatus.GENERATING ||
              status === AppStatus.GENERATING_IMAGE ? (
                <i className="fa-solid fa-circle-notch fa-spin"></i>
              ) : (
                <i className="fa-solid fa-wand-magic-sparkles"></i>
              )}
              {status === AppStatus.GENERATING
                ? "Calculating Audio"
                : status === AppStatus.GENERATING_IMAGE
                  ? "Painting Cover"
                  : "Forge Vibe"}
            </button>
          </section>

          {history.length > 0 && (
            <section className="glass-card p-6 rounded-2xl shadow-xl space-y-4 border-white/5">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                <i className="fa-solid fa-clock-rotate-left"></i> Archive
              </h2>
              <div className="space-y-2">
                {history.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadFromHistory(item)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all text-left group border border-transparent hover:border-white/10"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-900">
                      {item.coverImage ? (
                        <img
                          src={`data:image/jpeg;base64,${item.coverImage}`}
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-black">
                          <i className="fa-solid fa-music text-[10px] text-zinc-700"></i>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold truncate group-hover:text-purple-400 transition-colors text-zinc-300">
                        {item.playlistName}
                      </p>
                      <p className="text-[9px] text-zinc-600 font-mono">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </aside>

        <section className="lg:col-span-8 space-y-6">
          {(status === AppStatus.GENERATING ||
            status === AppStatus.GENERATING_IMAGE) && (
            <div className="glass-card p-12 rounded-2xl flex flex-col items-center justify-center space-y-8 min-h-[500px] border-white/5">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-purple-500/10 border-t-purple-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <i
                    className={`fa-solid ${status === AppStatus.GENERATING ? "fa-music" : "fa-palette"} text-purple-500 animate-pulse`}
                  ></i>
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black uppercase tracking-widest text-white">
                  {status === AppStatus.GENERATING
                    ? "Scanning the Multiverse"
                    : "Synthesizing Aesthetic"}
                </h3>
                <p className="text-zinc-500 text-sm italic">
                  {status === AppStatus.GENERATING
                    ? "Decoding perfect frequency matches..."
                    : "Painting an abstract signature for your sound..."}
                </p>
              </div>
            </div>
          )}

          {status === AppStatus.IDLE && (
            <div className="flex flex-col items-center justify-center min-h-[600px] text-center space-y-8 glass-card rounded-2xl border-dashed border-purple-500/10">
              <i className="fa-solid fa-compact-disc text-6xl text-purple-500/10 animate-[spin_12s_linear_infinite]"></i>
              <div className="space-y-2">
                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-zinc-800">
                  System Standby
                </h3>
                <p className="text-zinc-600 text-sm max-w-sm font-medium">
                  Define your sonic signature in the architect panel to initiate
                  generation.
                </p>
              </div>
            </div>
          )}

          {status === AppStatus.SUCCESS && currentPlaylist && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col md:flex-row gap-8 items-start md:items-end">
                <div className="w-48 h-48 md:w-56 md:h-56 rounded-2xl shadow-2xl overflow-hidden glass-card border-white/10 flex-shrink-0 bg-zinc-950">
                  {currentPlaylist.coverImage ? (
                    <img
                      src={`data:image/jpeg;base64,${currentPlaylist.coverImage}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900/40 to-black flex items-center justify-center">
                      <i className="fa-solid fa-music text-4xl text-purple-500/20"></i>
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-6">
                  <div>
                    <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-none">
                      {currentPlaylist.playlistName}
                    </h2>
                    <p className="text-zinc-400 text-sm mt-3 leading-relaxed max-w-xl font-medium">
                      {currentPlaylist.playlistDescription}
                    </p>
                  </div>
                  <button
                    onClick={handleSpotifySync}
                    className="bg-green-600 hover:bg-green-500 text-white font-black py-4 px-10 rounded-full text-xs flex items-center gap-3 transition-all shadow-xl shadow-green-900/20 active:scale-95"
                  >
                    <i className="fa-brands fa-spotify text-2xl"></i> Export to
                    Spotify
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {tracks.map((track, idx) => (
                  <TrackCard key={idx} track={track} index={idx} />
                ))}
              </div>
            </div>
          )}

          {status === AppStatus.SYNCING_SPOTIFY && (
            <div className="glass-card p-12 rounded-2xl flex flex-col items-center justify-center min-h-[400px] border-white/5">
              <div className="w-full max-w-md space-y-6">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  <span>Uploading Content</span>
                  <span>{syncProgress}%</span>
                </div>
                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300 shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                    style={{ width: `${syncProgress}%` }}
                  ></div>
                </div>
                <p className="text-center text-[10px] font-bold text-green-500/50 uppercase tracking-widest animate-pulse">
                  Establishing Cloud Sync...
                </p>
              </div>
            </div>
          )}

          {status === AppStatus.ERROR && (
            <div className="bg-red-500/5 border border-red-500/10 text-red-500 p-16 rounded-3xl text-center glass-card">
              <i className="fa-solid fa-triangle-exclamation text-4xl mb-6"></i>
              <h4 className="text-xl font-black uppercase tracking-widest mb-4">
                Transmission Error
              </h4>
              <p className="text-sm opacity-70 mb-8 max-w-sm mx-auto font-medium">
                {errorMsg}
              </p>
              <button
                onClick={() => setStatus(AppStatus.IDLE)}
                className="bg-zinc-900 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest text-white hover:bg-zinc-800 transition-colors"
              >
                Reset Terminal
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;
