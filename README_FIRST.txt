RAILOPS — EASIEST ONLINE DEMO SETUP (MAC OR ANY DEVICE)

This folder is prepared for deployment to Render so the booking demo and staff dashboard can open from different devices.

ONE-TIME SETUP (about 10–15 minutes):
1. Create/sign in to a GitHub account: https://github.com
2. Create a NEW repository named railops-demo. Choose Private if you prefer.
3. Upload every file in this folder to that repository (not the folder itself).
4. Create/sign in to Render: https://render.com
5. In Render choose New + > Blueprint, connect the GitHub repository, and deploy.
6. When it finishes, Render gives you a website address like https://railops-demo.onrender.com.
   Booking demo: that address
   Staff dashboard: add /staff.html to the address
7. Staff login username: staff. Find the generated STAFF_PASSWORD in the Render service Environment settings. Keep it private.

NOTES:
- First load on Render's free service may take about a minute after inactivity.
- This is only a prototype. It uses simulated trains and bookings, not official IRCTC/CRIS/NTES services, real train GPS, real payment, or actual cancellation/refunds.
- Free hosting uses temporary local storage. Data can be lost after a restart/redeploy; this is not a reliable permanent database.
- Never enter real passenger names, phone numbers, identity documents, payment information, or operational railway data. The public demo booking endpoint and this prototype are not production-secure.
- For real use, an approved railway integration, proper database, secure authentication, role permissions, and security review are required.
