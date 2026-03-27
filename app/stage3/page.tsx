"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Song = {
  id: number;
  title: string;
};

export default function Stage3Client() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [songs, setSongs] = useState<Song[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchSongs = async () => {
      if (!sessionId) {
        setMessage("세션 ID 없음");
        setLoading(false);
        return;
      }

      const { data: selections, error: selError } = await supabase
        .from("survey_selections")
        .select("song_id")
        .eq("session_id", sessionId)
        .eq("stage", "5");

      if (selError) {
        setMessage(`이전 데이터 불러오기 실패: ${selError.message}`);
        setLoading(false);
        return;
      }

      const songIds = selections?.map((s) => s.song_id) || [];

      if (songIds.length === 0) {
        setSongs([]);
        setLoading(false);
        return;
      }

      const { data: songsData, error: songError } = await supabase
        .from("Seventeen songs")
        .select("id, title")
        .in("id", songIds);

      if (songError) {
        setMessage(`곡 불러오기 실패: ${songError.message}`);
      } else {
        setSongs(songsData || []);
      }

      setLoading(false);
    };

    fetchSongs();
  }, [sessionId]);

  const toggleSelect = (id: number) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((item) => item !== id));
      return;
    }

    if (selected.length >= 3) {
      alert("3개까지만 선택 가능!");
      return;
    }

    setSelected([...selected, id]);
  };

  const handleSave = async () => {
    if (selected.length !== 3) {
      alert("정확히 3개 선택해야 합니다.");
      return;
    }

    if (!sessionId) {
      setMessage("세션 ID 없음");
      return;
    }

    setSaving(true);
    setMessage("");

    await supabase
      .from("survey_selections")
      .delete()
      .eq("session_id", sessionId)
      .eq("stage", "3");

    const rows = selected.map((songId) => ({
      session_id: sessionId,
      song_id: songId,
      stage: "3",
    }));

    const { error } = await supabase
      .from("survey_selections")
      .insert(rows);

    if (error) {
      setMessage(`저장 실패: ${error.message}`);
    } else {
      setMessage("3개 선택 저장 완료!");
      window.location.href = `/result?session_id=${sessionId}`;
    }

    setSaving(false);
  };

  if (loading) {
    return <div style={{ padding: "20px" }}>불러오는 중...</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>5곡 중 3곡 선택</h1>

      <div style={{ marginBottom: "16px", fontWeight: "bold" }}>
        선택 개수: {selected.length} / 3
      </div>

      <button
        onClick={handleSave}
        disabled={saving || selected.length !== 3}
        style={{
          marginBottom: "20px",
          padding: "10px 16px",
          border: "none",
          borderRadius: "8px",
          fontWeight: "bold",
          cursor: saving || selected.length !== 3 ? "not-allowed" : "pointer",
          backgroundColor:
            selected.length === 3 && !saving ? "#444" : "#ccc",
          color:
            selected.length === 3 && !saving ? "#fff" : "#666",
        }}
      >
        {saving ? "저장 중..." : "3곡 저장하기"}
      </button>

      {message && (
        <div style={{ marginBottom: "20px", color: "crimson" }}>
          {message}
        </div>
      )}

      {songs.map((song) => (
        <div
          key={song.id}
          onClick={() => toggleSelect(song.id)}
          style={{
            padding: "10px",
            marginBottom: "8px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            cursor: "pointer",
            backgroundColor: selected.includes(song.id)
              ? "#dbeafe"
              : "#fff",
          }}
        >
          {song.title}
        </div>
      ))}
    </div>
  );
}