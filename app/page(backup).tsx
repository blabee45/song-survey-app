"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Song = {
  id: number;
  title: string;
};

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {

    const submitted = localStorage.getItem("songSurveySubmitted");

    if (submitted === "true") {
    setBlocked(true);
    setLoading(false);
    return;
 }


    const fetchSongs = async () => {
      const { data, error } = await supabase
        .from("Seventeen songs") // 실제 노래 테이블 이름
        .select("id, title")
        .order("id", { ascending: true });

      if (error) {
        setMessage(`곡 불러오기 실패: ${error.message}`);
      } else {
        setSongs(data || []);
      }

      setLoading(false);
    };

    fetchSongs();
  }, []);

  const toggleSelect = (id: number) => {

   const getOrCreateSessionId = async () => {
  const existingSessionId = localStorage.getItem("songSurveySessionId");

  if (existingSessionId) {
    return existingSessionId;
  }

  const { data, error } = await supabase
    .from("survey_sessions")
    .insert({ current_stage: "50" })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "세션 생성 실패");
  }

  localStorage.setItem("songSurveySessionId", data.id);
  return data.id;
};



    if (selected.includes(id)) {
      setSelected(selected.filter((item) => item !== id));
      return;
    }

    if (selected.length >= 50) {
      alert("50개까지만 선택할 수 있어.");
      return;
    }

    setSelected([...selected, id]);
  };

  const handleSave = async () => {
    if (selected.length !== 50) {
      alert("정확히 50개를 선택해야 저장할 수 있어.");
      return;
    }

    setSaving(true);
    setMessage("");

    const sessionId = await getOrCreateSessionId();

    if (sessionError || !sessionData) {
      setMessage(`세션 저장 실패: ${sessionError?.message}`);
      setSaving(false);
      return;
    }

    await supabase
  .from("survey_selections")
  .delete()
  .eq("session_id", sessionId)
  .eq("stage", "50");

    const rows = selected.map((songId) => ({
      session_id: sessionId,
      song_id: songId,
      stage: "50",
    }));

    const { error: selectionError } = await supabase
      .from("survey_selections")
      .insert(rows);

    if (selectionError) {
      setMessage(`선택곡 저장 실패: ${selectionError.message}`);
      setSaving(false);
      return;
    }

    setMessage(`저장 완료! session_id: ${sessionId}`);
    setSaving(false);


   await supabase
  .from("survey_sessions")
  .update({ current_stage: "50" })
  .eq("id", sessionId);


    window.location.href = `/stage30?session_id=${sessionId}`;
  };

  if (loading) {
    return <div style={{ padding: "20px" }}>불러오는 중...</div>;
  }
  

  if (blocked) {
  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>이미 참여한 설문입니다.</h1>
      <p>이 브라우저에서는 중복 제출이 제한됩니다.</p>
    </div>
  );
}


  return (
    <div style={{ padding: "20px" }}>
      <h1>189곡 중 50곡 선택</h1>

      <div style={{ marginBottom: "16px", fontWeight: "bold" }}>
        선택 개수: {selected.length} / 50
      </div>

      <button
        onClick={handleSave}
        disabled={saving || selected.length !== 50}
        style={{
          marginBottom: "20px",
          padding: "10px 16px",
          cursor: saving || selected.length !== 50 ? "not-allowed" : "pointer",
        }}
      >
        {saving ? "저장 중..." : "50곡 저장하기"}
      </button>

      {message && (
        <div style={{ marginBottom: "20px", color: "crimson" }}>{message}</div>
      )}

      <div>
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
              backgroundColor: selected.includes(song.id) ? "#dbeafe" : "#fff",
            }}
          >
            {song.title}
          </div>
        ))}
      </div>
    </div>
  );
}