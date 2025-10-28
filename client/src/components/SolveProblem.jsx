import React, { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import "../CSS/SolveProblem.css";

// ⚙️ Judge0 API Configuration
const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com";
const RAPIDAPI_KEY = import.meta.env.VITE_JUDGE0_RAPIDAPI_KEY;
const RAPIDAPI_HOST = import.meta.env.VITE_JUDGE0_RAPIDAPI_HOST;

// 🧠 Language Map with Judge0 IDs
const languageMap = {
  python3: 71,
  cpp: 54,
  c: 50,
  java: 62,
  javascript: 63,
  csharp: 51,
  go: 60,
  php: 68,
  ruby: 72,
  swift: 83,
  kotlin: 78,
  typescript: 74,
  rust: 73,
};

// 🧩 Language Templates (Simple Hello World)
const codeTemplates = {
  python3: `print("Hello, World!")`,
  cpp: `#include <iostream>
using namespace std;
int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
  c: `#include <stdio.h>
int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  javascript: `console.log("Hello, World!");`,
  csharp: `using System;
class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
    }
}`,
  go: `package main
import "fmt"
func main() {
    fmt.Println("Hello, World!")
}`,
  php: `<?php
echo "Hello, World!";
?>`,
  ruby: `puts "Hello, World!"`,
  swift: `print("Hello, World!")`,
  kotlin: `fun main() {
    println("Hello, World!")
}`,
  typescript: `console.log("Hello, World!");`,
  rust: `fn main() {
    println!("Hello, World!");
}`,
};

// 🧠 Difficulty Map
const difficultyMap = {
  1: "Easy",
  2: "Medium",
  3: "Hard",
};

const SolveProblem = () => {
  const { id } = useParams();
  const location = useLocation();
  const [problem, setProblem] = useState(location.state?.problem || null);
  const [details, setDetails] = useState(null);
  const [parsedExamples, setParsedExamples] = useState([]);
  const [code, setCode] = useState("");
  const [languageId, setLanguageId] = useState(71);
  const [langSlug, setLangSlug] = useState("python3");
  const [stdin, setStdin] = useState("");
  const [expectedOutput, setExpectedOutput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // Load problem from localStorage if not found in route
  useEffect(() => {
    if (problem) return;
    try {
      const stored = JSON.parse(localStorage.getItem("leetcodeProblems") || "[]");
      const found = stored.find((p) => Number(p.id) === Number(id));
      if (found) setProblem(found);
      else
        setProblem({
          id,
          title: `Problem #${id}`,
          difficulty: "Easy",
          slug: `problem-${id}`.toLowerCase().replace(/\s+/g, "-"),
        });
    } catch {
      setProblem({
        id,
        title: `Problem #${id}`,
        difficulty: "Easy",
        slug: `problem-${id}`.toLowerCase().replace(/\s+/g, "-"),
      });
    }
  }, [id]);

  // Retry function with exponential backoff
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const fetchWithRetry = async (url, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const res = await fetch(url);
        if (res.ok) return res;
        if (res.status === 429) {
          const retryAfter = res.headers.get("Retry-After") || Math.pow(2, i) * 2000;
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

  // Fetch problem details from API
  useEffect(() => {
    const fetchProblemDetails = async () => {
      if (!problem?.slug || problem.slug.includes("problem-")) {
        setFetchError("Invalid problem slug.");
        return;
      }

      const detailsKey = `details_${problem.slug}`;
      const cached = localStorage.getItem(detailsKey);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          setDetails(data);
          parseExamples(data.exampleTestcases || "");
          return;
        } catch {
          localStorage.removeItem(detailsKey);
        }
      }

      setFetchError("");
      try {
        const apiUrl = `https://alfa-leetcode-api.onrender.com/select?titleSlug=${encodeURIComponent(
          problem.slug
        )}`;
        const res = await fetchWithRetry(apiUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const text = await res.text();
        if (text.trim().startsWith("<")) throw new Error("Received HTML response");

        const question = JSON.parse(text);
        if (question.status === "error") throw new Error(question.message || "Problem not found");

        setDetails(question);
        localStorage.setItem(detailsKey, JSON.stringify(question));
        parseExamples(question.exampleTestcases || "");

        const diff = difficultyMap[question.difficulty];
        setProblem((prev) => ({
          ...prev,
          title: question.title || prev.title,
          difficulty: diff || prev.difficulty,
        }));
      } catch (err) {
        setFetchError(err.message);
      }
    };
    fetchProblemDetails();
  }, [problem?.slug, id]);

  // Parse Example Testcases
  const parseExamples = (str) => {
    if (!str) return;
    const examples = [];
    const sections = str.split("\n\n");
    let current = {};
    sections.forEach((sec) => {
      if (sec.includes("Input:")) {
        if (current.input) examples.push(current);
        current = { input: sec.replace("Input:\n", "").trim() };
      } else if (sec.includes("Output:")) {
        current.output = sec.replace("Output:\n", "").trim();
      } else if (sec.includes("Explanation:")) {
        current.explanation = sec.replace("Explanation:\n", "").trim();
      }
    });
    if (current.input) examples.push(current);
    setParsedExamples(examples);
  };

  // Set default code template
  useEffect(() => {
    setCode(codeTemplates[langSlug] || "// Write your solution here");
  }, [langSlug]);

  // Save code
  useEffect(() => {
    if (problem?.id && code) {
      localStorage.setItem(`code_${problem.id}_${langSlug}`, code);
    }
  }, [code, problem?.id, langSlug]);

  // Change Language
  const handleLanguageChange = (newLangId, newLangSlug) => {
    setLanguageId(newLangId);
    setLangSlug(newLangSlug);
    const saved = localStorage.getItem(`code_${problem?.id}_${newLangSlug}`);
    setCode(saved || codeTemplates[newLangSlug] || "// Write your solution here");
  };

  // Load Example
  const loadExample = (example) => {
    setStdin(example.input);
    setExpectedOutput(example.output);
  };

  // Run Code
  const runCode = async () => {
    if (!RAPIDAPI_KEY) {
      setOutput("Error: RAPIDAPI_KEY not configured.");
      return;
    }
    setLoading(true);
    setOutput("");

    try {
      const res = await fetch(`${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": RAPIDAPI_HOST,
        },
        body: JSON.stringify({
          source_code: code,
          language_id: languageId,
          stdin: stdin || "",
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      let result = json.stdout || json.stderr || json.compile_output || "(no output)";
      if (expectedOutput && json.stdout?.trim() === expectedOutput.trim()) {
        result += "\n\n✅ Test Passed!";
      } else if (expectedOutput) {
        result += `\n\nExpected: ${expectedOutput}\n❌ Test Failed`;
      }
      setOutput(result);
    } catch (err) {
      setOutput("Error running code: " + err.message);
    }

    setLoading(false);
  };

  if (!problem)
    return (
      <div className="solve-container">
        <h2>Loading problem...</h2>
        <Link to="/" className="back-btn">
          ⬅ Back
        </Link>
      </div>
    );

  const difficulty =
    details?.difficulty?.level || typeof problem.difficulty === "string"
      ? problem.difficulty
      : "Unknown";

  return (
    <div className="solve-container">
      <div className="global-header">
        <Link to="/coding-dashboard" className="back-btn">
          ⬅ Dashboard
        </Link>
        <div className="header-title">
          <h1>{details?.title || problem.title}</h1>
          <span className={`difficulty-tag ${difficulty.toLowerCase()}`}>{difficulty}</span>
        </div>
      </div>

      <div className="main-content">
        <div className="problem-info">
          <section className="section">
            <h2>Problem Description</h2>
            {details ? (
              <div
                className="description-content"
                dangerouslySetInnerHTML={{ __html: details.content || details.question }}
              />
            ) : fetchError ? (
              <div className="error-message">
                <p>Failed to load details: {fetchError}</p>
                <button onClick={() => window.location.reload()}>Retry</button>
              </div>
            ) : (
              <p>Loading description...</p>
            )}
          </section>

          {parsedExamples.length > 0 && (
            <section className="section">
              <h2>Examples</h2>
              {parsedExamples.map((ex, i) => (
                <div key={i} className="example">
                  <h3>Example {i + 1}</h3>
                  <p><strong>Input:</strong></p>
                  <pre>{ex.input}</pre>
                  <p><strong>Output:</strong> <code>{ex.output}</code></p>
                  {ex.explanation && <p><strong>Explanation:</strong> {ex.explanation}</p>}
                  <button className="example-btn" onClick={() => loadExample(ex)}>Run This Test</button>
                </div>
              ))}
            </section>
          )}
        </div>

        <div className="compiler-section">
          <div className="editor-controls">
            <label>
              Language:{" "}
              <select
                value={langSlug}
                onChange={(e) => {
                  const newSlug = e.target.value;
                  handleLanguageChange(languageMap[newSlug], newSlug);
                }}
              >
                {Object.keys(languageMap).map((lang) => (
                  <option key={lang} value={lang}>
                    {lang.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
            <button onClick={runCode} disabled={loading} className="run-button">
              {loading ? "Running..." : "Run Code"}
            </button>
          </div>

          <textarea
            className="code-editor"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck="false"
          />

          <div className="io-section">
            <div className="input-section">
              <h3>Input</h3>
              <textarea
                className="input-box"
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
              />
            </div>
            <div className="output-section">
              <h3>Output</h3>
              <pre className="output-box">{output}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolveProblem;
