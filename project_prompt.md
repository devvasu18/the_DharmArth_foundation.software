# AI Agent Master Prompt: Enterprise NGO Donation Platform

**Role:** You are a Senior Software Architect and Full-Stack Developer designed to build production-ready, enterprise-grade applications.
**Goal:** Build a "Real-World" NGO Donation Platform.
**Current Phase:** Single-module structure, but strictly designed for future migration to a multi-module microservices architecture.

---

## 1. Core Vision & Architectural Integrity
*   **Scalability First:** The codebase must follow **Clean Architecture** principles. Separation of concerns is paramount to allow future migration to a multi-module system without a rewrite.
*   **Enterprise Quality:** proper error handling, logging, validation, and security best practices from line one.
*   **No "Dummy" Implementations:** All logic must be real and ready for production data.

## 2. Security & Dynamic Role System (The Foundation)
Before implementing any feature, you must implement the **Security & Permission Core**:

### Super Admin
*   Created **only** via a secure code initialization or protected setup process.
*   Has absolute control.

### Dynamic Role Management (No Fixed Roles)
*   **Strict Rule:** Apart from Super Admin, there are **NO hardcoded roles** (like "Manager", "Editor").
*   Role Creation:
    *   Roles are created dynamically by the Super Admin by providing the mobile number of an existing user. The user will be created through the normal login/registration process, and after that, the Super Admin will assign one or more roles to that user.
    *   Permission Library:
        *   Every feature or module added to the software must automatically register its permissions (View, Add, Edit, Delete) into a central Permission Library.
    *   Note: If “Add”, “Edit”, or “Delete” is selected, “View” must be automatically selected by default.
*   Assignment:
    *   While creating a role, the Super Admin selects the required permissions from the Permission Library.

A single user can have multiple roles, so this must be properly managed in the database with a scalable and normalized structure.

In the sidebar, root modules must be maintained properly for each role.

All assigned roles should appear under the main root of the Donation Platform in the sidebar, because more modules will be added in the future and the structure must remain clean, expandable, and well-organized.

## 3. Dynamic Content Engine
*   **Strict Rule:** **Nothing** is hardcoded.
*   **Content Management:** All text, images, links, slider configurations, form field visibility, and operational flags must be stored in the database and managed via a Super Admin Panel.
*   **media:** Use **Cloudinary** for all image storage/management.

## 4. Specific Module Requirements & UI References

### A. Navbar (Reference: Image 1)
*   Match the layout and structure of the reference.
*   Fully dynamic, managed via Admin Panel.

### B. Hero Slider (Reference: Image 2)
*   **Location:** Immediately below Navbar.
*   **Logic:**
    *   **< 4 Images:** Static display (e.g., 3 images fixed side-by-side). No animation.
    *   **4+ Images:** Activate "Hero Mode". Slider rotates images left-to-right with a smooth, premium dial-like animation.
*   **CTA Button:**
    *   Link managed by Admin.
    *   **Logic:**
        *   If Not Logged In -> Redirect to Login Page.
        *   If Logged In (via Donation Button click) -> Redirect to Donation Form.
        *   If Logged In (Normal Login) -> Redirect to Home Page.

### C. login / Sign Up (Reference: Image 4)
*   **Modifications:** Remove "Billing Address" and "Pincode" inputs from the reference UI.
*   **Feature Flag:** "Save a life with just ₹10..." message visibility controlled by Super Admin.
*   **Auth Flow:** Standard secure login/signup.
*  *super admin can see the all users created , newly created users   "

### D. Footer (Reference: Image 3)
*   Value matches reference structure.
*   All links and text dynamic.

### E. Donation Form (Reference: Image 5)
*   **Context:** User is already logged in (redirected here).
*   **Pre-fill:** Name and Mobile Number auto-filled from profile (editable).
*   **Referral Logic ("Motivated By" vs "Referred Via"):**
    1.  **Motivated By (Field 1):**
        *   Input: Mobile Number.
        *   Behavior: On entering 10 digits, query DB. If user exists, auto-populate their Name.
        *   Mandatory: Only if "Referred Via" is NOT selected.
    2.  **Referred Via (Field 2):**
        *   Dropdown: Instagram, Facebook, WhatsApp, YouTube, Website, Friend, Other.
        *   Mandatory: Only if "Motivated By" is NOT filled.
    3.  **Checkbox:** "Are you Indian?"
*   **Donation Details:**
    *   Amount Selection.
    *   Email (Optional).
    *   **Tax Benefits:** Checkbox "Need 80G Certificate". If checked -> Show PAN Card & Aadhaar Card inputs.

## 5. Business Logic & Flows

### Donation Commission System (The "Motivated By" Logic)
*   **Structure:**
    *   **Level 1 (Direct Referral):** 10% commission to the motivator.
    *   **Level 2 (Indirect Referral): 3% commission.
        This commission will be given to the motivator of the Level 1 motivator (i.e., the referrer’s referrer).
*   **Wallet:** Users have a "Wallet" section to view earned commissions.
*   **Payout:** Claims allowed every 3 months.
*   **Notifications:** Notify the "Motivator" immediately upon a successful donation linked to their number.
* share user to earn more commission 
    a good tempalte will be made and that customer mobile no will be thare in that so user can set them as motivator mobile no. in form 
*   **Auditing:** Admin audits all flows.

### Payment Gateway
*   **Current State:** Test Mode.
*   **Flow:**
    1.  User clicks "Proceed to Pay".
    2.  Show mock "Payment Successful" screen.
    3.  **Action:** Save donation data -> Trigger Commission Logic -> Mark record "Payment: Test Success" -> Send details to Admin.

## 6. Implementation Strategy
1.  **Phase 1:** Build the **Core Identity & Security Layer** (Role System, Permission Library).
2.  **Phase 2:** Implement **Dynamic Content Engine** schema.
3.  **Phase 3:** Build UI Modules (Navbar, Slider, Footer).
4.  **Phase 4:** Build Auth & Donation Module with the complex Business Logic.

---
**Note to Agent:** Treat this as a living specification. If I ask to build something else later, this foundation must remain the invariant source of truth.


- use brevo for email sending 
 basic env - 
MONGODB_URI=mongodb+srv://vasudevsharma:code4life%402007@cluster0.mo8nveo.mongodb.net/ecommerce?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_change_in_production_e-commerce-2026
JWT_REFRESH_SECRET=your_refresh_secret_key_min_32_characters_change_in_production_refresh-2026
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

BREVO_API_KEY=your_brevo_api_key_here
SENDER_EMAIL=noreply@yourdomain.com
SENDER_NAME=E-Commerce Store

# Cloudinary (Image CDN & Storage)
CLOUDINARY_CLOUD_NAME=dbe1ykvg8
CLOUDINARY_API_KEY=925211585914851
CLOUDINARY_API_SECRET=ooathSADhiEswyE_W1uI9tVzmL8