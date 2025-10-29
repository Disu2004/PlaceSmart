import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../CSS/CodingDashboard.css";
import Navbar from "./Navbar";

const CodingDashboard = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const proxyUrl = "https://api.allorigins.win/raw?url=";
  const targetUrl = "https://leetcode.com/api/problems/all/";

  // Set a default userId once (in an effect to avoid running during render or in non-browser envs)
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("userId", "1101");
      }
    } catch (e) {
      console.warn("Could not access localStorage to set userId", e);
    }
  }, []);

  // Retry function with exponential backoff
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchWithRetry = async (url, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const res = await fetch(url);
        if (res.ok) return res;
        if (res.status === 429 || res.status >= 500) {
          const retryAfter = res.headers.get('Retry-After') || Math.pow(2, i) * 2000;
          console.warn(`Request failed (${res.status}). Retrying in ${retryAfter}ms...`);
          await delay(retryAfter);
          continue;
        }
        throw new Error(`HTTP ${res.status}`);
      } catch (err) {
        if (i === maxRetries - 1) throw err;
        await delay(Math.pow(2, i) * 1000);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    const fetchProblems = async () => {
      try {
        const res = await fetchWithRetry(proxyUrl + encodeURIComponent(targetUrl));
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (parseErr) {
          console.error("JSON parse error:", parseErr);
          throw new Error("Invalid response format - possibly rate limited or server error");
        }
        if (cancelled) return;

        const allProblems = data.stat_status_pairs.map((item) => ({
          id: item.stat.question_id,
          title: item.stat.question__title,
          difficulty:
            item.difficulty.level === 1
              ? "Easy"
              : item.difficulty.level === 2
                ? "Medium"
                : "Hard",
          slug: item.stat.question__title_slug,
        }));

        // Shuffle & limit for performance
        const selected = allProblems.sort(() => Math.random() - 0.5).slice(0, 50);

        setProblems(selected);
        // Persist for SolveProblem page to read
        try {
          localStorage.setItem("leetcodeProblems", JSON.stringify(selected));
        } catch (e) {
          console.warn("Could not save problems to localStorage", e);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching problems:", err);
        setLoading(false);
        // Fallback: Try to load from localStorage if available
        try {
          const stored = JSON.parse(localStorage.getItem("leetcodeProblems") || "[]");
          if (stored.length > 0) {
            setProblems(stored.sort(() => Math.random() - 0.5).slice(0, 50));
          }
        } catch (e) {
          console.warn("Fallback load failed:", e);
        }
      }
    };

    fetchProblems();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <h2 className="loading">Loading coding problems...</h2>;

  return (
    <>
      <Navbar />
      <div className="coding-container">
        <header className="cd-header">
          <h1 className="main-title">💻 Coding Problems</h1>
          <p className="subtitle">Black & Gold practice board — click a problem to solve inline</p>
        </header>

        <div className="problem-grid">
          {problems.map((p, idx) => (
            <div className="problem-card" key={p.id}>
              <div className="card-content">
                <h3 className="problem-title">
                  <Link to={`/solve-problem/${p.id}`} state={{ problem: p }} className="problem-link">
                    {p.title}
                  </Link>
                </h3>
                <p className={`difficulty-tag ${p.difficulty.toLowerCase()}`}>
                  {p.difficulty}
                </p>
              </div>
              <a
                className="external-link"
                href={`https://leetcode.com/problems/${p.slug}/`}
                target="_blank"
                rel="noopener noreferrer"
                title="Open on LeetCode"
                aria-label="Open on LeetCode"
              >
                ↗
              </a>
            </div>
          ))}
        </div>
      </div></>
  );
};

export default CodingDashboard;