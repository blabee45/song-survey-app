"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type SongCount = {
  id: number;
  title: string;
  count: number;
};

export default function AdminPage() {
  const [top50, setTop50] = useState<SongCount[]>([]);
  const [top30, setTop30] = useState<SongCount[]>([]);
  const [top10, setTop10] = useState<SongCount[]>([]);
  const [top5, setTop5] = useState<SongCount[]>([]);
  const [top3, setTop3] = useState<SongCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchTopSongs = async () => {
      setLoading(true);
      setMessage("");

      try {
        const result50 = await getTopSongsByStage("50");
        const result30 = await getTopSongsByStage("30");
        const result10 = await getTopSongsByStage("10");
        const result5 = await getTopSongsByStage("5");
        const result3 = await getTopSongsByStage("3");

        setTop50(result50);
        setTop30(result30);
        setTop10(result10);
        setTop5(result5);
        setTop3(result3);
      } catch (err) {
        setMessage("관리자 데이터를 불러오는 중 오류가 발생했습니다.");
        console.error(err);
      }

      setLoading(false);
    };

    fetchTopSongs();
  }, []);

  const getTopSongsByStage = async (stage: string): Promise<SongCount[]> => {
    const { data: selections, error } = await supabase
      .from("survey_selections")
      .select("song_id")
      .eq("stage", stage);

    if (error) {
      throw new Error(error.message);
    }

    const songIds = selections?.map((item) => item.song_id) || [];

    if (songIds.length === 0) {
      return [];
    }

    const countMap: Record<number, number> = {};

    for (const id of songIds) {
      countMap[id] = (countMap[id] || 0) + 1;
    }

    const sortedEntries = Object.entries(countMap)
      .map(([songId, count]) => ({
        songId: Number(songId),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topSongIds = sortedEntries.map((item) => item.songId);

    const { data: songsData, error: songError } = await supabase
      .from("Seventeen songs")
      .select("id, title")
      .in("id", topSongIds);

    if (songError) {
      throw new Error(songError.message);
    }

    const songMap = new Map<number, string>();
    (songsData || []).forEach((song) => {
      songMap.set(song.id, song.title);
    });

    return sortedEntries.map((item) => ({
      id: item.songId,
      title: songMap.get(item.songId) || `곡 ID ${item.songId}`,
      count: item.count,
    }));
  };

  const renderTable = (title: string, data: SongCount[]) => (
    <div style={{ marginBottom: "40px" }}>
      <h2 style={{ marginBottom: "16px" }}>{title}</h2>

      {data.length === 0 ? (
        <p>데이터가 없습니다.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #ddd",
            backgroundColor: "#fff",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
              <th style={{ border: "1px solid #ddd", padding: "10px" }}>순위</th>
              <th style={{ border: "1px solid #ddd", padding: "10px" }}>곡 제목</th>
              <th style={{ border: "1px solid #ddd", padding: "10px" }}>선택 수</th>
            </tr>
          </thead>
          <tbody>
            {data.map((song, index) => (
              <tr key={song.id}>
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: "10px",
                    textAlign: "center",
                  }}
                >
                  {index + 1}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                  {song.title}
                </td>
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: "10px",
                    textAlign: "center",
                  }}
                >
                  {song.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  if (loading) {
    return <div style={{ padding: "20px" }}>관리자 데이터 불러오는 중...</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ marginBottom: "32px" }}>설문 관리자 페이지</h1>

      {message && (
        <div style={{ marginBottom: "20px", color: "crimson" }}>
          {message}
        </div>
      )}

      {renderTable("TOP 10 - 50곡 선택 결과", top50)}
      {renderTable("TOP 10 - 30곡 선택 결과", top30)}
      {renderTable("TOP 10 - 10곡 선택 결과", top10)}
      {renderTable("TOP 10 - 5곡 선택 결과", top5)}
      {renderTable("TOP 10 - 3곡 선택 결과", top3)}
    </div>
  );
}