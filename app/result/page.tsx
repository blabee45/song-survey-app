"use client";

import { useEffect } from "react";

export default function ResultPage() {
  useEffect(() => {
    localStorage.setItem("songSurveySubmitted", "true");
    localStorage.removeItem("songSurveySessionId");
  }, []);

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>참여해주셔서 감사합니다 🙏</h1>
      <p>설문이 정상적으로 제출되었습니다.</p>
    </div>
  );
}