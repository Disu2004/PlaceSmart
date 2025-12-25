import React, { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import "../CSS/SolveProblem.css";

// This component allows users to solve coding problems with a built-in editor and runner.
// It fetches problem details, handles code submissions, and displays results.

// ⚙️ Judge0 API Configuration
const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com";
const RAPIDAPI_KEY = import.meta.env.VITE_JUDGE0_RAPIDAPI_KEY;
const RAPIDAPI_HOST = import.meta.env.VITE_JUDGE0_RAPIDAPI_HOST;

// 🧠 Language Map with Judge0 IDs
// Maps language names to their corresponding Judge0 language IDs.
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
// Provides default "Hello, World!" code templates for each language.
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
// Maps difficulty levels from numerical values to string representations.
const difficultyMap = {
  1: "Easy",
  2: "Medium",
  3: "Hard",
};

const SolveProblem = () => {
  // Extract problem ID from URL parameters.
  const { id } = useParams();
  const location = useLocation();
  // Initialize state variables for problem details, code, and output.
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
    if (problem) return; // If problem already loaded, skip.
    try {
      // Attempt to retrieve problem data from local storage.
      const stored = JSON.parse(localStorage.getItem("leetcodeProblems") || "[]");
      const found = stored.find((p) => Number(p.id) === Number(id));
      if (found) setProblem(found); // Set problem if found in local storage.
      else
        setProblem({
          // Create a default problem object if not found.
          id,
          title: `Problem #${id}`,
          difficulty: "Easy",
          slug: `problem-${id}`.toLowerCase().replace(/\s+/g, "-"),
        });
    } catch {
      // Handle potential errors during local storage retrieval.
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
    // Implement retry logic for fetching data, handling rate limits.
    for (let i = 0; i < maxRetries; i++) {
      try {
        const res = await fetch(url);
        if (res.ok) return res; // Return response if successful.
        if (res.status === 429) {
          // Handle rate limiting by waiting before retrying.
          const retryAfter = res.headers.get("Retry-After") || Math.pow(2, i) * 2000;
          await delay(retryAfter);
          continue;
        }
        throw new Error(`HTTP ${res.status}`);
      } catch (err) {
        // Throw error if max retries reached.
        if (i === maxRetries - 1) throw err;
        await delay(Math.pow(2, i) * 1000);
      }
    }
  };

  // Fetch problem details from API
  useEffect(() => {
    // Fetches problem details from the API based on the problem slug.
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
        // Construct the API URL using the problem slug.
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
    // Parses the example test cases from a string format.
    if (!str) return;
    const examples = [];
    const sections = str.split("\n\n");
    let current = {};
    sections.forEach((sec) => {
      // Iterate through sections to extract input, output, and explanation.
      if (sec.includes("Input:")) {
        if (current.input) examples.push(current); // Push previous example.
        current = { input: sec.replace("Input:\n", "").trim() }; // Start new example.
      } else if (sec.includes("Output:")) {
        current.output = sec.replace("Output:\n", "").trim(); // Extract output.
      } else if (sec.includes("Explanation:")) {
        current.explanation = sec.replace("Explanation:\n", "").trim(); // Extract explanation.
      }
    });
    if (current.input) examples.push(current); // Push the last example.
    setParsedExamples(examples);
  };

  // Set default code template
  useEffect(() => {
    // Sets the code editor's content to the default template for the selected language.
    setCode(codeTemplates[langSlug] || "// Write your solution here");
  }, [langSlug]);

  // Save code
  useEffect(() => {
    // Saves the current code in local storage for persistence.
    if (problem?.id && code) {
      localStorage.setItem(`code_${problem.id}_${langSlug}`, code);
    }
  }, [code, problem?.id, langSlug]);

  // Change Language
  const handleLanguageChange = (newLangId, newLangSlug) => {
    // Handles language changes in the editor.
    setLanguageId(newLangId);
    setLangSlug(newLangSlug);
    const saved = localStorage.getItem(`code_${problem?.id}_${newLangSlug}`);
    // Load saved code or default template when language changes.
    setCode(saved || codeTemplates[newLangSlug] || "// Write your solution here");
  };

  // Load Example
  const loadExample = (example) => {
    // Loads an example test case into the input and expected output fields.
    setStdin(example.input);
    setExpectedOutput(example.output);
  };

  // Run Code
  const runCode = async () => {
    // Executes the code using the Judge0 API.
    if (!RAPIDAPI_KEY) {
      setOutput("Error: RAPIDAPI_KEY not configured.");
      return;
    }
    setLoading(true);
    setOutput("");

    try {
      // Send code to Judge0 API for execution.
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
      // Check if the output matches the expected output.
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
    // Display loading message if problem details are not yet available.
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
              // Display problem description if available.
              <div
                className="description-content"
                dangerouslySetInnerHTML={{ __html: details.content || details.question }}
              />
            ) : fetchError ? (
              // Display error message if fetching problem details failed.
              <div className="error-message">
                <p>Failed to load details: {fetchError}</p>
                <button onClick={() => window.location.reload()}>Retry</button>
              </div>
            ) : (
              // Display loading message while fetching problem details.
              <p>Loading description...</p>
            )}
          </section>

          {parsedExamples.length > 0 && (
            // Display example test cases if available.
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
                  // Handle language selection changes.
                  const newSlug = e.target.value;
                  handleLanguageChange(languageMap[newSlug], newSlug);
                }}
              >
                {Object.keys(languageMap).map((lang) => (
                  // Populate language options from the language map.
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
// End of SolveProblem component.  Renders the problem-solving interface.