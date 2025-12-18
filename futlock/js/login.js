// =====================================================
// FUTLOCK - LOGIN CON API ASÍNCRONA
// =====================================================

// Configuración de la API
const API_URL = 'api';

// Verificar si ya hay sesión activa
document.addEventListener('DOMContentLoaded', () => {
    const usuario = sessionStorage.getItem('usuario');
    if (usuario) {
        window.location.href = 'dashboard.html';
    }
});

// Manejar envío del formulario
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorDiv = document.getElementById('error-message');
    const btnLogin = document.querySelector('.btn-login');
    
    // Validar campos vacíos
    if (!username || !password) {
        showError('Por favor complete todos los campos');
        return;
    }
    
    // Deshabilitar botón mientras procesa
    btnLogin.disabled = true;
    btnLogin.textContent = 'VERIFICANDO...';
    
    try {
        // Llamada asíncrona a la API
        const response = await fetch(`${API_URL}/login.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Login exitoso - guardar datos del usuario
            sessionStorage.setItem('usuario', JSON.stringify(data.user));
            
            // Mostrar mensaje de éxito
            errorDiv.style.display = 'block';
            errorDiv.style.background = 'rgba(0, 200, 83, 0.1)';
            errorDiv.style.color = '#00C853';
            errorDiv.style.borderColor = 'rgba(0, 200, 83, 0.3)';
            errorDiv.textContent = `¡Bienvenido, ${data.user.nombre}!`;
            
            // Redirigir después de 1 segundo
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } else {
            // Error de autenticación
            showError(data.message || 'Credenciales incorrectas');
            btnLogin.disabled = false;
            btnLogin.textContent = 'INICIAR SESIÓN';
        }
        
    } catch (error) {
        console.error('Error de conexión:', error);
        showError('Error de conexión con el servidor. Verifique que XAMPP esté corriendo.');
        btnLogin.disabled = false;
        btnLogin.textContent = 'INICIAR SESIÓN';
    }
});

// Función para mostrar errores
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.style.display = 'block';
    errorDiv.style.background = 'rgba(213, 0, 0, 0.1)';
    errorDiv.style.color = '#FF5252';
    errorDiv.style.borderColor = 'rgba(213, 0, 0, 0.3)';
    errorDiv.textContent = message;
    
    // Animación de shake
    errorDiv.style.animation = 'none';
    setTimeout(() => {
        errorDiv.style.animation = 'shake 0.5s ease-in-out';
    }, 10);
}

// Añadir animación de shake al CSS dinámicamente
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);
