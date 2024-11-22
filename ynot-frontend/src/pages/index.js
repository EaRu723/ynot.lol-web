import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import styles from "@/styles/Home.module.css";

export default function Home() {
  const showcaseGridRef = useRef(null);
  const [sites, setSites] = useState([]);

  function openModal() {
    document.getElementById("submitModal").style.display = "block";
  }

  function closeModal() {
    document.getElementById("submitModal").style.display = "none";
  }

  async function fetchSites() {
    try {
      const response = await fetch("https://your-backend.onrender.com/api/sites");
      const data = await response.json();
      // Convert the object to an array of site details
      const sitesArray = Object.values(data);
      setSites(sitesArray);
    } catch (error) {
      console.error("Error fetching sites:", error);
    }
  }

  useEffect(() => {
    fetchSites();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.target;

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
      });

      if (response.ok) {
        alert("Thank you for submitting your website!");
        form.reset();
        closeModal();
        fetchSites(); // refresh the sites
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong. Please try again.");
    }
  }

  return (
    <>
      <Head>
        <title>The Internet's White Pages</title>
        <meta name="description" content="Powered by LSD" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1>
          Discover cool <i>people</i>.
        </h1>
        <p>Because Y not lol?</p>
        <div>
          <div>
            <input
              type="search"
              placeholder="Search..."
              aria-label="Search personal sites"
            />
          </div>
          <div>
            <button className={styles.submitButton} onClick={openModal}>
              Add Your Site
            </button>
          </div>
        </div>

        <div
          className={styles.showcaseGrid}
          ref={showcaseGridRef}
          id="showcase-grid"
        >
          {sites.map((site, index) => (
            <div
              key={index}
              className={styles.showcaseRow}
              onClick={() => window.open(site.url, "_blank")}
            >
              <div className={styles.iframeWrapper}>
                <iframe
                  src={site.url}
                  title={site.name}
                  loading="lazy"
                  className={styles.showcaseItem}
                  scrolling="no"
                  style={{ pointerEvents: "none" }}
                />
              </div>
            </div>
          ))}
        </div>
      </main>

      <div id="submitModal" className={styles.modal}>
        <div className={styles.modalContent}>
          <span className={styles.closeButton} onClick={closeModal}>
            &times;
          </span>
          <h2 style={{ marginTop: 0, marginBottom: "1.5rem" }}>
            Submit Your Website
          </h2>
          <form
            id="siteSubmitForm"
            onSubmit={handleSubmit}
            action="https://formsubmit.co/andrearusso2399@gmail.com"
            method="POST"
          >
            <div className={styles.formGroup}>
              <label htmlFor="name">Your Name</label>
              <input type="text" id="name" name="name" required />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>
              <input type="email" id="email" name="email" required />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="url">Website URL</label>
              <input
                type="url"
                id="url"
                name="url"
                required
                placeholder="https://"
              />
            </div>
            <button type="submit" className={styles.submitButton}>
              Submit Website
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
