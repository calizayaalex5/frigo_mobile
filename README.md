# Overview

Inventory Frigo is a mobile app for managing the inventory, clients, sales and staff of a refrigeration equipment business. I built it as the mobile front end for a Node.js and MongoDB backend I had already created. My goal as a software engineer was to learn how to turn an existing REST API into a real mobile product: an app that each person in the business can use from their phone, where every screen adapts to the user's role and every action is validated by the server.

**How to use the app**

1. Log in with your email and password. The session is saved on the device, so you stay logged in after closing and reopening the app. Use **Log out** to end the session.
2. The **Home** screen shows a summary of the business: total stock per store, low stock alerts, number and total of sales and, for the boss, the inventory value at cost with the average margin. It also shows quick actions for your role.
3. Use the bottom tab bar to move between **Home**, **Clients** and **Sales** (the tabs you see depend on your role).
4. What each role can do:
   - **Boss:** view, add and edit products; view, add, edit and delete clients; register sales and review all sales; create, edit and delete staff accounts (boss, seller, warehouse).
   - **Seller:** view products (without acquisition cost), view and add clients, register sales and review their own sales.
   - **Warehouse:** view stock per store (without prices).
   - **Customer:** view products and review their own purchases.
5. To register a sale, choose a client, a store, the products with their quantities and the payment type (and method, for cash payments). The stock of that store is discounted automatically, and the server rejects the sale if there is not enough stock.

The app does not decide what each role is allowed to see or do. The backend filters fields and enforces permissions on every request, and the app shows what it receives and displays the server's error messages.

**Purpose**

I wanted to practice building a complete mobile client on top of an API: authentication with JSON Web Tokens, role-based screens and navigation, local persistence of the session, forms that create, edit and delete data, and clear handling of the errors returned by the server.

[Software Demo Video](http://youtube.link.goes.here)

# Development Environment

- React Native with Expo, using Expo Router for file-based navigation (stack screens and a native tab bar).
- TypeScript.
- `@react-native-async-storage/async-storage` to keep the login token on the device.
- `@expo/vector-icons` and SF Symbols for icons.
- Tested on an iPhone with Expo Go and in the web browser.
- Backend (separate project): Node.js, Express, MongoDB Atlas, `jsonwebtoken` and `bcryptjs`.
- Postman to test the API, and Visual Studio Code as the editor.

**Running the project**

1. Start the backend (`node server.js`).
2. In `src/constants/api.ts`, set `API_URL` to the address of the backend. To use the app on a phone, use the local IP address of the computer running the backend (for example `http://192.168.x.x:3000`), with the phone and the computer on the same Wi-Fi network.
3. Install the dependencies with `npm install` and start the app with `npx expo start`. Scan the QR code with Expo Go, or press `w` to open it in the browser.

# Useful Websites

- [Expo Documentation](https://docs.expo.dev)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Expo Router - Native tabs](https://docs.expo.dev/router/advanced/native-tabs/)
- [React Native Documentation](https://reactnative.dev)
- [Async Storage](https://react-native-async-storage.github.io/async-storage/)
- [Curso REACT NATIVE para Principiantes + Aplicación DESDE CERO con Expo](https://www.youtube.com/watch?v=U23lNFm_J70&t=1725s/)

# Future Work

- Let the warehouse role edit stock from the app (the backend already allows it).
- Take the seller of a sale from the login token on the server instead of the request body.
- Validate quantities on the server (reject zero or negative values) and check ownership in the "get sale by id" route.
- Validate the role when updating a user, and end active sessions when a user is deleted or their role changes.
- Allow a sale to combine stock from both stores.
- Add product categories and filters, and delete products from the app.
- Deploy the API over HTTPS and store the token with secure storage on the device.
