// ======================
// CONFIGURATION SUPABASE
// ======================
const SUPABASE_URL = 'https://txovnfqhbmqfhwyihdil.supabase.co/rest/v1/'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4b3ZuZnFoYm1xZmh3eWloZGlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NTA5ODcsImV4cCI6MjEwMzQyNjk4N30.bLUlTmNyHJlP52H6dfANccJ8JkWm7f_i031AEOAUDUo'

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ======================
// ÉLÉMENTS DE LA PAGE
// ======================
const app = document.getElementById('app')

// ======================
// VÉRIFIER LA SESSION
// ======================
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
        showLoggedIn(session.user)
    } else {
        showLoginForm()
    }
}

// ======================
// AFFICHER FORMULAIRE DE CONNEXION
// ======================
function showLoginForm() {
    app.innerHTML = `
    <div class="form-group">
      <label>Email</label>
      <input type="email" id="email" placeholder="ton@email.com">
    </div>
    <div class="form-group">
      <label>Mot de passe</label>
      <input type="password" id="password" placeholder="••••••••">
    </div>
    <button id="loginBtn">Se connecter</button>
    <button id="signupBtn" style="background:#16a34a; margin-left:10px;">Créer un compte</button>
    <p id="message" class="error"></p>
  `

    document.getElementById('loginBtn').addEventListener('click', login)
    document.getElementById('signupBtn').addEventListener('click', signup)
}

// ======================
// AFFICHER QUAND ON EST CONNECTÉ
// ======================
function showLoggedIn(user) {
    app.innerHTML = `
    <p>Connecté en tant que : <strong>${user.email}</strong></p>
    <button id="logoutBtn">Se déconnecter</button>
    <hr style="margin: 20px 0;">
    <p>Prochaine étape : on ajoutera le calendrier et les rappels ici.</p>
  `

    document.getElementById('logoutBtn').addEventListener('click', logout)
}

// ======================
// FONCTIONS AUTH
// ======================
async function login() {
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    const message = document.getElementById('message')

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    })

    if (error) {
        message.textContent = error.message
    } else {
        showLoggedIn(data.user)
    }
}

async function signup() {
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    const message = document.getElementById('message')

    const { data, error } = await supabase.auth.signUp({
        email,
        password
    })

    if (error) {
        message.textContent = error.message
    } else {
        message.style.color = 'green'
        message.textContent = 'Compte créé ! Vérifie ton email pour confirmer.'
    }
}

async function logout() {
    await supabase.auth.signOut()
    showLoginForm()
}

// ======================
// DÉMARRAGE
// ======================
checkSession()