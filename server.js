const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const path = require('path');
const app = express();
const port = 5000;

// Database connection
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'db',
    password: 'Parkavi@19',
    port: 5432,
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, 'index.html')));

// Serve the HTML form
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle form submission
app.post('/signup', async (req, res) => {
    const { username, email, mobile } = req.body;
    try {
        await pool.query('INSERT INTO users (username, email, mobile) VALUES ($1, $2, $3)', [username, email, mobile]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error inserting data:', err);
        res.status(500).json({ success: false, error: 'Failed to add user' });
    }
});

// Display users in HTML table
app.get('/db', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        
        // Construct the HTML response
        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Users List</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
            <style>
                .popup {
                    display: none; 
                    position: fixed; 
                    top: 50%; 
                    left: 50%; 
                    transform: translate(-50%, -50%); 
                    background-color: white; 
                    padding: 20px; 
                    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5); 
                    z-index: 1000; 
                }
                .popup .close-btn {
                    position: absolute; 
                    top: 10px; 
                    right: 10px; 
                    cursor: pointer; 
                }
                .overlay {
                    display: none; 
                    position: fixed; 
                    top: 0; 
                    left: 0; 
                    width: 100%; 
                    height: 100%; 
                    background: rgba(0, 0, 0, 0.5); 
                    z-index: 500; 
                }
            </style>
        </head>
        <body>
            <h1>Users List</h1>
            <button id="addUserBtn" class="btn btn-primary mb-3">Add User</button>
            <table class='table table-hover'>
                <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>Actions</th>
                </tr>`;

        result.rows.forEach(user => {
            html += `
                <tr>
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td>${user.mobile}</td>
                    <td>
                        <a href="/edit/${user.id}" class="btn btn-sm btn-warning">Edit</a>
                        <a href="/delete/${user.id}" class="btn btn-sm btn-danger">Delete</a>
                    </td>
                </tr>`;
        });

        html += `
            </table>

            <!-- Popup Form -->
            <div id="overlay" class="overlay"></div>
            <div id="popup" class="popup">
                <span class="close-btn" id="closePopupBtn">&times;</span>
                <h2>Add User</h2>
                <form id="addUserForm">
                    <div class="mb-3">
                        <label for="username" class="form-label">Username</label>
                        <input type="text" name="username" class="form-control" id="username" required>
                    </div>
                    <div class="mb-3">
                        <label for="email" class="form-label">Email</label>
                        <input type="email" name="email" class="form-control" id="email" required>
                    </div>
                    <div class="mb-3">
                        <label for="mobile" class="form-label">Mobile</label>
                        <input type="tel" name="mobile" class="form-control" id="mobile" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Submit</button>
                </form>
            </div>

            <script>
                document.getElementById('addUserBtn').addEventListener('click', function() {
                    document.getElementById('popup').style.display = 'block';
                    document.getElementById('overlay').style.display = 'block';
                });

                document.getElementById('closePopupBtn').addEventListener('click', function() {
                    document.getElementById('popup').style.display = 'none';
                    document.getElementById('overlay').style.display = 'none';
                });

                document.getElementById('overlay').addEventListener('click', function() {
                    document.getElementById('popup').style.display = 'none';
                    document.getElementById('overlay').style.display = 'none';
                });

                document.getElementById('addUserForm').addEventListener('submit', function(event) {
                    event.preventDefault();
                    const username = document.getElementById('username').value;
                    const email = document.getElementById('email').value;
                    const mobile = document.getElementById('mobile').value;

                    $.ajax({
                        url: '/signup',
                        type: 'POST',
                        data: {
                            username: username,
                            email: email,
                            mobile: mobile
                        },
                        success: function(response) {
                            if (response.success) {
                                alert('User added successfully!');
                                // Hide the popup after submission
                                document.getElementById('popup').style.display = 'none';
                                document.getElementById('overlay').style.display = 'none';
                                // Optionally, refresh the user list or perform other actions
                                location.reload(); // Reload the page to show the new user
                            } else {
                                alert('Failed to add user. Please try again.');
                            }
                        },
                        error: function() {
                            alert('Error occurred. Please try again.');
                        }
                    });
                });
            </script>
        </body>
        </html>`;
        
        // Send the constructed HTML as the response
        res.send(html);
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).send('Server error');
    }
});

// Serve edit form
app.get('/edit/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        const user = result.rows[0];

        if (user) {
            let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Edit User</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
                <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
                </head>
            <body>
                <h1>Edit User</h1>
                <form action="/edit/${user.id}" method="POST">
                    <div class="mb-3">
                        <label for="username" class="form-label">Username</label>
                        <input type="text" name="username" class="form-control" id="username" value="${user.username}">
                    </div>
                    <div class="mb-3">
                        <label for="email" class="form-label">Email</label>
                        <input type="email" name="email" class="form-control" id="email" value="${user.email}">
                    </div>
                    <div class="mb-3">
                        <label for="mobile" class="form-label">Mobile</label>
                        <input type="text" name="mobile" class="form-control" id="mobile" value="${user.mobile}">
                    </div>
                    <button type="submit" class="btn btn-primary">Update</button>
                </form>
            </body>
            </html>`;
            
            res.send(html);
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        console.error('Error fetching user data:', err);
        res.status(500).send('Server error');
    }
});

// Handle edit form submission
app.post('/edit/:id', async (req, res) => {
    const userId = req.params.id;
    const { username, email, mobile } = req.body;
    try {
        await pool.query('UPDATE users SET username = $1, email = $2, mobile = $3 WHERE id = $4', [username, email, mobile, userId]);
        res.redirect('/db');
    } catch (err) {
        console.error('Error updating data:', err);
        res.status(500).send('Server error');
    }
});

// Handle delete user
app.get('/delete/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);
        res.redirect('/db');
    } catch (err) {
        console.error('Error deleting data:', err);
        res.status(500).send('Server error');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});