// ======================
// CONFIGURATION SUPABASE
// ======================
const SUPABASE_URL = 'https://txovnfqhbmqfhwyihdil.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4b3ZuZnFoYm1xZmh3eWloZGlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NTA5ODcsImV4cCI6MjEwMzQyNjk4N30.bLUlTmNyHJlP52H6dfANccJ8JkWm7f_i031AEOAUDUo'

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ======================
const app = document.getElementById('app')

// ======================
// VÉRIFIER LA SESSION AU DÉMARRAGE
// ======================
async function init() {
  const { data: { session } } = await supabaseClient.auth.getSession()

  if (session) {
    showApp(session.user)
  } else {
    showAuth()
  }

  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
      showApp(session.user)
    } else {
      showAuth()
    }
  })
}

// ======================
// PAGE CONNEXION / INSCRIPTION
// ======================
function showAuth() {
  app.innerHTML = `
    <div class="form-group">
      <label>Email</label>
      <input type="email" id="email" placeholder="ex: monemail@gmail.com">
    </div>
    <div class="form-group">
      <label>Mot de passe</label>
      <input type="password" id="password" placeholder="Minimum 6 caractères">
    </div>
    <button class="btn-primary" id="loginBtn">Se connecter</button>
    <button class="btn-success" id="signupBtn">Créer un compte</button>
    <p id="message" class="message"></p>
  `

  document.getElementById('loginBtn').onclick = login
  document.getElementById('signupBtn').onclick = signup
}

// ======================
// PAGE PRINCIPALE (connecté)
// ======================
async function showApp(user) {
  app.innerHTML = `
    <div class="user-info">
      <p>Connecté : <strong>${user.email}</strong></p>
      <button class="btn-secondary" id="logoutBtn" style="width:auto; margin-top:8px;">Se déconnecter</button>
    </div>

    <h2>Nouveau RDV / Rappel</h2>
    <div class="form-group">
      <label>Titre</label>
      <input type="text" id="title" placeholder="Ex: Inscription aides">
    </div>
    <div class="form-group">
      <label>Description (optionnel)</label>
      <textarea id="description" rows="2" placeholder="Détails..."></textarea>
    </div>
    <div class="form-group">
      <label>Date et heure</label>
      <input type="datetime-local" id="start_at">
    </div>
    <button class="btn-primary" id="addBtn">Ajouter</button>
    <p id="formMessage" class="message"></p>

    <h2>Mes rappels</h2>
    <div id="remindersList">
      <p class="loading">Chargement des rappels...</p>
    </div>
  `

  document.getElementById('logoutBtn').onclick = logout
  document.getElementById('addBtn').onclick = addReminder

  loadReminders()
}

// ======================
// AUTHENTIFICATION
// ======================
async function login() {
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  const message = document.getElementById('message')

  message.textContent = 'Connexion...'
  message.className = 'message'

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password })

  if (error) {
    message.textContent = error.message
    message.className = 'message error'
  }
}

async function signup() {
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  const message = document.getElementById('message')

  message.textContent = 'Création du compte...'
  message.className = 'message'

  const { error } = await supabaseClient.auth.signUp({ email, password })

  if (error) {
    message.textContent = error.message
    message.className = 'message error'
  } else {
    message.textContent = 'Compte créé ! Vérifie ton email pour confirmer (regarde aussi les spams).'
    message.className = 'message success'
  }
}

async function logout() {
  await supabaseClient.auth.signOut()
}

// ======================
// GESTION DES RAPPELS
// ======================
async function addReminder() {
  const title = document.getElementById('title').value.trim()
  const description = document.getElementById('description').value.trim()
  const start_at = document.getElementById('start_at').value
  const formMessage = document.getElementById('formMessage')

  if (!title || !start_at) {
    formMessage.textContent = 'Titre et date sont obligatoires'
    formMessage.className = 'message error'
    return
  }

  formMessage.textContent = 'Ajout en cours...'
  formMessage.className = 'message'

  const { data: { user } } = await supabaseClient.auth.getUser()

  const { error } = await supabaseClient.from('reminders').insert({
    user_id: user.id,
    title,
    description: description || null,
    start_at: new Date(start_at).toISOString()
  })

  if (error) {
    formMessage.textContent = error.message
    formMessage.className = 'message error'
  } else {
    formMessage.textContent = 'Rappel ajouté !'
    formMessage.className = 'message success'
    document.getElementById('title').value = ''
    document.getElementById('description').value = ''
    document.getElementById('start_at').value = ''
    loadReminders()
  }
}

async function loadReminders() {
  const list = document.getElementById('remindersList')
  list.innerHTML = '<p class="loading">Chargement...</p>'

  const { data, error } = await supabaseClient
    .from('reminders')
    .select('*')
    .order('start_at', { ascending: true })

  if (error) {
    list.innerHTML = `<p class="message error">${error.message}</p>`
    return
  }

  if (!data || data.length === 0) {
    list.innerHTML = '<p class="empty">Aucun rappel pour le moment.</p>'
    return
  }

  list.innerHTML = data.map(r => `
    <div class="reminder-card">
      <h3>${r.title}</h3>
      <p>${r.description || ''}</p>
      <p><strong>${formatDate(r.start_at)}</strong></p>
      <div class="reminder-actions">
        <button class="btn-danger" onclick="deleteReminder('${r.id}')">Supprimer</button>
      </div>
    </div>
  `).join('')
}

async function deleteReminder(id) {
  if (!confirm('Supprimer ce rappel ?')) return

  const { error } = await supabaseClient.from('reminders').delete().eq('id', id)

  if (!error) {
    loadReminders()
  } else {
    alert('Erreur : ' + error.message)
  }
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ======================
// DÉMARRAGE
// ======================
init()
