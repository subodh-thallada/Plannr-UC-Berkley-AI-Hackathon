import React from "react";

export default function HackathonWebsite() {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f2027 0%, #2c5364 100%)", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
      <header style={{ padding: "2rem 0", textAlign: "center", borderBottom: "1px solid #1a2636", background: "rgba(0,0,0,0.7)" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: 900, letterSpacing: "-2px", color: "#4fc3f7", textShadow: "0 2px 16px #0ff" }}>
          Gen AI Hackathon 2024
        </h1>
        <p style={{ fontSize: "1.5rem", color: "#b3e5fc", marginTop: "1rem" }}>
          October 17-18, Madison Square Garden, NYC
        </p>
        <p style={{ fontSize: "1.1rem", color: "#90caf9", marginTop: "0.5rem" }}>
          ~400 participants | Theme: <span style={{ color: "#fff" }}>Generative AI</span>
        </p>
      </header>
      <main style={{ maxWidth: 700, margin: "3rem auto", background: "rgba(20,30,50,0.85)", borderRadius: 24, boxShadow: "0 8px 32px #000a", padding: "2.5rem 2rem" }}>
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "#4fc3f7", marginBottom: 12 }}>About the Hackathon</h2>
          <p style={{ fontSize: "1.15rem", color: "#e3f2fd" }}>
            Join us for an electrifying 36-hour hackathon at the iconic Madison Square Garden! Dive into the world of Generative AI, collaborate with top talent, and build the next wave of AI-powered applications. Whether you're a coder, designer, or AI enthusiast, this is your chance to innovate, learn, and connect.
          </p>
        </section>
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "#4fc3f7", marginBottom: 12 }}>Event Details</h2>
          <ul style={{ fontSize: "1.1rem", color: "#b3e5fc", lineHeight: 2, listStyle: "none", padding: 0 }}>
            <li><strong>Date:</strong> October 17-18, 2024</li>
            <li><strong>Location:</strong> Madison Square Garden, New York City</li>
            <li><strong>Participants:</strong> ~400</li>
            <li><strong>Theme:</strong> Generative AI</li>
            <li><strong>Prizes:</strong> $20,000+ in cash & swag</li>
            <li><strong>Workshops:</strong> AI, ML, and more</li>
            <li><strong>Free food, swag, and 24/7 venue access</strong></li>
          </ul>
        </section>
        <section>
          <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "#4fc3f7", marginBottom: 12 }}>Register Now</h2>
          <a href="#" style={{ display: "inline-block", background: "linear-gradient(90deg, #1565c0, #00bcd4)", color: "#fff", fontWeight: 700, fontSize: "1.2rem", padding: "0.9rem 2.5rem", borderRadius: 999, boxShadow: "0 2px 16px #00bcd4aa", textDecoration: "none", marginTop: 8, letterSpacing: 1 }}>
            Registration Coming Soon
          </a>
        </section>
      </main>
      <footer style={{ textAlign: "center", color: "#b3e5fc", padding: "2rem 0 1rem 0", fontSize: "1rem" }}>
        &copy; 2024 Gen AI Hackathon. All rights reserved.
      </footer>
    </div>
  );
}
