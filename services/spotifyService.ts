export const spotifyAuth = {
  clientId: "47afd8a95a6c4073a50f26ae8f02a2df",

  getRedirectUri() {
    let uri = window.location.origin + window.location.pathname;
    // Spotify strictly requires 127.0.0.1 instead of localhost for development
    if (uri.includes("localhost")) {
      uri = uri.replace("localhost", "127.0.0.1");
    }
    // Remove trailing slashes for consistency if they exist
    return uri.endsWith("/") ? uri.slice(0, -1) : uri;
  },

  async login() {
    if (this.clientId === "YOUR_SPOTIFY_CLIENT_ID" || !this.clientId) {
      alert("Configuration Missing: Please set your Spotify Client ID.");
      return;
    }

    const codeVerifier = this.generateRandomString(128);
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    // Store verifier for later exchange
    localStorage.setItem("spotify_code_verifier", codeVerifier);

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: "code",
      redirect_uri: this.getRedirectUri(),
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
      scope:
        "playlist-modify-public playlist-modify-private user-read-private user-read-email ugc-image-upload",
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  },

  async handleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const codeVerifier = localStorage.getItem("spotify_code_verifier");

    if (!code || !codeVerifier) return null;

    const payload = {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.clientId,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: this.getRedirectUri(),
        code_verifier: codeVerifier,
      }),
    };

    try {
      const response = await fetch(
        "https://accounts.spotify.com/api/token",
        payload,
      );
      const data = await response.json();

      if (data.access_token) {
        localStorage.setItem("spotify_access_token", data.access_token);
        // Clean up verifier and URL
        localStorage.removeItem("spotify_code_verifier");
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
        return data.access_token;
      } else {
        console.error("Spotify Token Error:", data);
      }
    } catch (err) {
      console.error("Spotify Auth Fetch Error:", err);
    }
    return null;
  },

  getAccessToken() {
    return localStorage.getItem("spotify_access_token");
  },

  logout() {
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_code_verifier");
  },

  generateRandomString(length: number) {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  },

  async generateCodeChallenge(v: string) {
    const data = new TextEncoder().encode(v);
    const digest = await window.crypto.subtle.digest("SHA-256", data);
    return btoa(
      String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  },
};

export const spotifyApi = {
  async fetchProfile() {
    const token = spotifyAuth.getAccessToken();
    if (!token) return null;
    const res = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok ? res.json() : null;
  },

  async searchTrack(title: string, artist: string) {
    const token = spotifyAuth.getAccessToken();
    const query = encodeURIComponent(`track:${title} artist:${artist}`);
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const data = await res.json();
    return data.tracks?.items?.[0]?.uri;
  },

  async uploadPlaylistCover(playlistId: string, base64Image: string) {
    const token = spotifyAuth.getAccessToken();
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
    await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/images`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "image/jpeg",
      },
      body: cleanBase64,
    });
  },

  async createPlaylist(
    userId: string,
    name: string,
    trackUris: string[],
    description: string,
    coverBase64?: string,
  ) {
    const token = spotifyAuth.getAccessToken();
    const createRes = await fetch(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description, public: false }),
      },
    );
    const playlist = await createRes.json();

    if (trackUris.length > 0) {
      await fetch(
        `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uris: trackUris }),
        },
      );
    }

    if (coverBase64) {
      try {
        await this.uploadPlaylistCover(playlist.id, coverBase64);
      } catch (e) {
        console.error("Cover upload failed", e);
      }
    }

    return playlist.external_urls.spotify;
  },
};
