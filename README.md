# **Software Requirements Specification (SRS)**

**Project Title:** The Simplest Bookkeeper
**Prepared by:** Priscilla AI
**Date:** May 26, 2025
**Version:** 1.1

---

## **1. Introduction**

### 1.1 Purpose

The Simplest Bookkeeper is a voice-first, ultra-low-friction bookkeeping tool designed to help informal business owners in Africa track their finances using voice notes via WhatsApp-style interfaces. This document defines the functional and non-functional requirements for the application.

### 1.2 Intended Audience

This SRS is intended for:

* Product Managers
* Software Developers
* UX Designers
* QA Testers
* Investors and Stakeholders

### 1.3 Scope

The Simplest Bookkeeper allows users to log sales and expenses using voice or text, view balance summaries, and generate simple financial reports. It stores transaction data locally or in the cloud and provides a credit scoring feature to help users demonstrate financial reliability. The interface mimics a WhatsApp chat and supports both online and offline usage.

---

## **2. Overall Description**

### 2.1 Product Perspective

The product is a lightweight, AI-powered web app accessible via mobile browsers. It integrates voice transcription, natural language parsing, and simple data storage, with a roadmap to integrate with the WhatsApp Business API.

### 2.2 Product Features

* Voice-to-text transcription
* Automatic transaction parsing (amount, type, category, item)
* Daily balance and cashbook generation
* Offline-first functionality with cloud sync
* Smart credit scoring system
* Chat-style user interface with contextual prompts

### 2.3 User Classes and Characteristics

* **Informal business owners** with basic smartphone literacy
* **Low-literacy users** relying primarily on voice
* **Partners and developers** interested in data insights or integrations

### 2.4 Operating Environment

* Built using Vite, React, and TypeScript
* Mobile-first progressive web app (PWA)
* Integrates with Firestore and optionally Google Sheets
* Compatible with mobile microphones and speech APIs

---

## **3. Functional Requirements**

### 3.1 Onboarding

* **FR1:** Show welcome screen with a 3-step setup wizard
* **FR2:** Store business type, currency, and initial balance

### 3.2 Input & Interaction

* **FR3:** Accept and transcribe voice notes using Web Speech API or external API
* **FR4:** Parse transaction data: amount, type (sale/expense), category, and item
* **FR5:** Accept manual text input with same parsing logic
* **FR6:** Allow voice/text toggle in chat interface
* **FR7:** Suggest actions (e.g., "Want to log a sale?") based on user activity

### 3.3 Data Management

* **FR8:** Store transactions in Firestore or Google Sheets
* **FR9:** Cache data locally using `localStorage` or IndexedDB
* **FR10:** Sync local data with cloud when online
* **FR11:** Export data as CSV on request

### 3.4 Reporting

* **FR12:** Generate daily snapshots: income, expenses, and net balance
* **FR13:** Display a chronological "Cashbook"
* **FR14:** Allow weekly and monthly financial overviews

### 3.5 Credit Scoring

* **FR15:** Collect and analyze transaction behavior (volume, regularity, consistency)
* **FR16:** Update credit score daily using predefined scoring logic
* **FR17:** Display a credit score dashboard: score, trend, influencing factors
* **FR18:** Allow users to export/share their score with lenders or partners
* **FR19:** Recommend actions to improve credit score (e.g., "Log daily sales")

---

## **4. Non-Functional Requirements**

### 4.1 Usability

* Zero training required; intuitive design
* Prioritize visual cues and voice guidance for low-literacy users

### 4.2 Performance

* Voice-to-text response: < 3 seconds
* Parsing response: < 1 second

### 4.3 Reliability

* Offline support with automatic sync
* Duplicate transaction prevention logic

### 4.4 Security

* Data stored with encryption via Firestore rules or OAuth (Google Sheets)
* No personally identifiable information (PII) collected unless explicitly entered

### 4.5 Maintainability

* Modular architecture using React components
* Clear separation between UI, logic, and storage

### 4.6 Scalability

* Scalable for millions of users
* Region-based data isolation supported
* Roadmap includes WhatsApp Business API integration

### 4.7 Accuracy

* Credit scoring must consistently reflect financial behavior
* Use transparent, explainable scoring logic

### 4.8 Privacy

* Credit data stored securely and shared only with user consent
* Compliant with local data protection laws

---

## **5. External Interface Requirements**

### 5.1 User Interfaces

* **Onboarding Wizard**: Quick setup flow
* **Chat UI**: Accepts inputs and displays history
* **Cashbook View**: Daily/weekly/monthly summaries
* **Credit Dashboard**: Displays score and history

### 5.2 Hardware Interfaces

* Smartphone microphone and speaker for voice features

### 5.3 Software Interfaces

* Google Cloud Firestore / Firebase
* Google Sheets API (optional backup/export layer)
* Web Speech API or OpenAI Whisper for transcription
* Internal Credit Scoring Engine or external scoring API

---

## **6. Assumptions and Dependencies**

* Users have intermittent access to mobile data or Wi-Fi
* Devices support mobile browsers and audio input
* Voice transcription services (e.g., OpenAI Whisper) are reliably available
* Credit scoring logic will be based on transaction behavior, not external financial histories

---

Would you like help next on:

* Designing the **credit scoring logic** itself?
* Creating user **flows and wireframes** for onboarding or credit dashboard?
* Drafting a **pitch deck** or **technical roadmap** for stakeholders or funders?
