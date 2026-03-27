"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Song = {
  id: number;
  title: string;
};

export default function Stage5Page() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [songs, setSongs] = useState<Song[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchSongs = async () => {
      if (!sessionId) return;

      // 1️⃣ 이전 단계(10개)에서 선택한 song_id 가져오기
      const { data: selections, error: selError } = await supabase
        .from("survey_selections")
        .select("song_id")
        .eq("session_id", sessionId)
        .eq("stage", "10");

      if (selError) {
        setMessage(`이전 데이터 불러오기 실패: ${selError.message}`);
        setLoading(false);
        return;
      }

      const songIds = selections?.map((s) => s.song_id) || [];

      // 2️⃣ 해당 song_id들의 실제 제목 가져오기
      const { data: songsData, error: songError } = await supabase
        .from("Seventeen songs") // ← 너 노래 테이블 이름
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

    if (selected.length >= 5) {
      alert("5개까지만 선택 가능!");
      return;
    }

    setSelected([...selected, id]);
  };

  const handleSave = async () => {
    if (selected.length !== 5) {
      alert("정확히 5개 선택해야 합니다.");
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
      .eq("stage", "5");

    const rows = selected.map((songId) => ({
      session_id: sessionId,
      song_id: songId,
      stage: "5",
    }));

    const { error } = await supabase
      .from("survey_selections")
      .insert(rows);

    if (error) {
      setMessage(`저장 실패: ${error.message}`);
    } else {
      setMessage("5개 선택 저장 완료!");
      window.location.href = `/stage3?session_id=${sessionId}`;
    }

    setSaving(false);
  };

  if (loading) {
    return <div style={{ padding: "20px" }}>불러오는 중...</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>10곡 중 5곡 선택</h1>

      <div style={{ marginBottom: "16px", fontWeight: "bold" }}>
        선택 개수: {selected.length} / 5
      </div>

      <button
        onClick={handleSave}
        disabled={saving || selected.length !== 5}
        style={{
          marginBottom: "20px",
          padding: "10px 16px",
backgroundColor:
      selected.length === 50 && !saving ? "#444" : "#ccc",
    color:
      selected.length === 50 && !saving ? "#fff" : "#666",
        }}
      >
        {saving ? "저장 중..." : "5곡 저장하기"}
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