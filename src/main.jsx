import "./style.css";
import Experience from "./Experience/Experience.js";
import React from "react";
import { createRoot } from "react-dom/client";
import GamesHub from "./games/GamesHub.jsx";

const experience = new Experience(document.querySelector(".experience-canvas"));

const gameRoot = document.getElementById("find-my-path-root");
if (gameRoot) {
  createRoot(gameRoot).render(<GamesHub />);
}

const galleryModal = document.querySelector(".gallery-modal");
const modalImage = document.querySelector(".gallery-modal-image");
const galleryCounter = document.querySelector(".gallery-counter");
const closeButton = document.querySelector(".gallery-close");
const prevButton = document.querySelector(".gallery-prev");
const nextButton = document.querySelector(".gallery-next");
const galleries = document.querySelectorAll(".project-gallery");
const galleryToggles = document.querySelectorAll(".gallery-toggle");

let activeGalleryImages = [];
let activeIndex = 0;

const updateModalImage = () => {
  if (!activeGalleryImages.length || !modalImage) return;
  const currentImage = activeGalleryImages[activeIndex];
  modalImage.src = currentImage.src;
  modalImage.alt = currentImage.alt || "Project preview";
  if (galleryCounter) {
    galleryCounter.textContent = `${activeIndex + 1} / ${activeGalleryImages.length}`;
  }
};

const openGalleryModal = (galleryElement, clickedImage) => {
  if (!galleryModal) return;
  activeGalleryImages = Array.from(galleryElement.querySelectorAll("img"));
  activeIndex = activeGalleryImages.indexOf(clickedImage);
  updateModalImage();
  galleryModal.classList.add("is-visible");
  galleryModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
};

const closeGalleryModal = () => {
  if (!galleryModal) return;
  galleryModal.classList.remove("is-visible");
  galleryModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
};

const showNextImage = (direction = 1) => {
  if (!activeGalleryImages.length) return;
  activeIndex = (activeIndex + direction + activeGalleryImages.length) % activeGalleryImages.length;
  updateModalImage();
};

galleries.forEach((gallery) => {
  gallery.addEventListener("click", (event) => {
    const target = event.target;
    if (target && target.tagName === "IMG") {
      openGalleryModal(gallery, target);
    }
  });
});

closeButton?.addEventListener("click", closeGalleryModal);
prevButton?.addEventListener("click", () => showNextImage(-1));
nextButton?.addEventListener("click", () => showNextImage(1));

galleryModal?.addEventListener("click", (event) => {
  if (event.target === galleryModal) {
    closeGalleryModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (!galleryModal || !galleryModal.classList.contains("is-visible")) return;
  if (event.key === "Escape") closeGalleryModal();
  if (event.key === "ArrowRight") showNextImage(1);
  if (event.key === "ArrowLeft") showNextImage(-1);
});

galleryToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const targetGallery = toggle.dataset.target;
    const galleryElement = document.querySelector(`.project-gallery[data-gallery="${targetGallery}"]`);
    if (!galleryElement) return;
    const shouldExpand = !galleryElement.classList.contains("show-all");
    galleryElement.classList.toggle("show-all", shouldExpand);
    const expandLabel = toggle.dataset.expandLabel || "View all images";
    const collapseLabel = toggle.dataset.collapseLabel || "Show fewer images";
    toggle.textContent = shouldExpand ? collapseLabel : expandLabel;
    toggle.setAttribute("aria-expanded", String(shouldExpand));
  });
});

const timelineButtons = document.querySelectorAll("[data-timeline-toggle]");

timelineButtons.forEach((button) => {
  const item = button.closest(".timeline-item");
  const body = item?.querySelector(".timeline-body");

  button.addEventListener("click", () => {
    const isExpanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!isExpanded));
    item?.classList.toggle("is-open", !isExpanded);
    if (body) {
      if (isExpanded) {
        body.setAttribute("hidden", "");
      } else {
        body.removeAttribute("hidden");
      }
    }
  });
});
