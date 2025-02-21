    import express from 'express'
    import bodyParser from 'body-parser'
    import session from 'express-session'
    import passport from 'passport';
    import dotenv from "dotenv";
    import nodemailer from 'nodemailer'
    import { Strategy as GoogleStrategy } from "passport-google-oauth20";
    import { Strategy as LocalStrategy } from "passport-local";
    import bcrypt from 'bcrypt';
    import pg from 'pg';
    import cors from 'cors';
    import jwt from "jsonwebtoken";

    const app=express();
    const port=3000;
    const saltRounds = 10;
    const authenticateToken = (req, res, next) => {
      const token = req.headers['authorization']?.split(' ')[1];
  
      console.log("Received Token:", token); // Debugging
  
      if (!token) {
          return res.status(401).json({ message: 'Unauthorized, token missing' });
      }
  
      jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
          if (err) {
              console.log("JWT Error:", err); // Debugging
              return res.status(403).json({ message: 'Invalid token' });
          }
  
          console.log("Decoded User:", user); // Debugging
          req.user = user;
          next();
      });
  };
  

    app.use(cors({
      origin: ["http://localhost:5173", "http://localhost:3000"],  // Allow requests from your frontend
      methods: 'GET,POST,PUT,DELETE',
      credentials: true  // Allow cookies and sessions
    }));
    // ✅ Apply Middleware Globally (Optional)


    app.use(bodyParser.urlencoded({extended:true}))
    app.use(express.json());

    dotenv.config();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
          user: process.env.EMAIL, 
          pass: process.env.PASSWORD,
      },
      debug: true, // Enable debugging
      logger: true, // Log email sending process
    });



    const db = new pg.Client({
        user: process.env.PG_USER,
        host: process.env.PG_HOST,
        database: process.env.PG_DATABASE,
        password: process.env.PG_PASSWORD,
        port: process.env.PG_PORT,
      });
    db.connect();


    app.use(session({
        secret:process.env.SECRET_KEY,
        resave:false,
        saveUninitialized:false
    }))


    app.use(passport.initialize());
    app.use(passport.session());

    // app.get('/login',passport.authenticate('local',{
    //     successRedirect:,
    //     failureRedirect:,
    // }))

    app.get("/logout", (req, res) => {
        req.logout(function (err) {
          if (err) {
            return next(err);
          }
          res.redirect("/");
        });
      });
      
    app.get('/auth/google',passport.authenticate('google',{
      scope:["profile","email"]
    }))

    app.post('/add', authenticateToken, async (req, res) => { 
      console.log("Decoded User:", req.user);
      const { marktext, title, description } = req.body;
      const email = req.user?.email; // ✅ Now req.user is available
  
      if (!email) {
          return res.status(400).json({ message: "User email is missing" });
      }
  
      try {
          const result = await db.query(
              'INSERT INTO data (email, marktext, title, description) VALUES ($1, $2, $3, $4) RETURNING *',
              [email, marktext, title, description]
          );
          res.json({ message: 'ok', note: result.rows[0] });
      } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'error', error });
      }
  });

  // Update existing note
  app.put('/add', authenticateToken,async (req, res) => {
      const { id, marktext, title, description } = req.body;
      const email = req.user?.email;
      try {
          const result = await db.query(
              'UPDATE data SET email=$1, marktext=$2, title=$3, description=$4 WHERE id=$5 RETURNING *',
              [email, marktext, title, description, id]
          );
          res.json({ message: 'ok', note: result.rows[0] });
      } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'error', error });
      }
  });

    app.get(
        "/auth/google/secrets",
        passport.authenticate("google", { failureRedirect: "/login" }),
        (req, res) => {
            if (!req.user) {
                return res.redirect("http://localhost:5173/login");
            }
    
            // Generate JWT token
            const token = jwt.sign(
                { id: req.user.id, email: req.user.email }, 
                process.env.SECRET_KEY
            );
    
            // Redirect to frontend with token
            res.redirect(`http://localhost:5173/dashboard?token=${token}`);
        }
    );

    app.post("/contact", (req, res) => {
      const { name, email, topic, problem } = req.body;

      if (!name || !email || !topic || !problem) {
          return res.status(400).json({ message: "All fields are required" });
      }

      const mailOptions = {
          from: process.env.EMAIL, // Ensure this is your configured email
          to: process.env.EMAIL,   // Your email to receive complaints
          subject: `Complaint topic: ${topic}`,
          text: `Name: ${name}\nEmail: ${email}\nProblem: ${problem}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              console.error("Error sending email:", error);
              return res.status(500).json({ message: "Email sending failed", error: error.toString() });
          }
          res.status(200).json({ message: "Email sent successfully" });
      });
    });

    app.get('/get-data', authenticateToken, async (req, res) => {
      const email = req.user.email; // Extract email from decoded JWT
      console.log("Fetching data for email:", email); // Debugging
  
      try {
          const result = await db.query(
              'SELECT id, title, description FROM data WHERE email = $1',
              [email]
          );
  
          res.json({ message: 'ok', data: result.rows });
      } catch (error) {
          console.error("Error fetching data:", error);
          res.status(500).json({ message: 'error', error });
      }
  });

    app.get('/dashboard',(req,res)=>{
      const result=db.query('Select title,description from data where email=$1',[req.user.userid])
      res.send(result)
    })


    app.post('/search',async(req,res)=>{
      console.log(req.body)
      const result=await db.query('SELECT * FROM data WHERE id=$1',[req.body['id']])
      if(result.rows.length==0){
        res.json({message:'false'})
      }
      else{
        res.json({resultsgot:result.rows[0],message:'true'})
      }
    })

    app.post("/register", async (req, res) => {
      const name=req.body.name
      const email = req.body.email;
      const password = req.body.password;

      try {
        const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
          email,
        ]);
    
        if (checkResult.rows.length > 0) {
          res.redirect("/login");
        } else {
          bcrypt.hash(password, saltRounds, async (err, hash) => {
            if (err) {
              console.error("Error hashing password:", err);
            } else {
              const result = await db.query(
                "INSERT INTO users (name,email, password) VALUES ($1, $2,$3) RETURNING *",
                [name,email,hash]
              );
              const user = result.rows[0];
              req.login(user, (err) => {
                console.log("success");
                const token = jwt.sign(
                  { id: req.user.id, email: req.user.email }, 
                  process.env.SECRET_KEY, 
                  { expiresIn: "1h" } 
                );
                res.json({token,message:"Registration successful!"})
              });
            }
          });
        }
      } catch (err) {
        console.error("Error during registration:", err);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

app.post('/login', (req, res, next) => {
  console.log("Received login request:", req.body); 
        passport.authenticate("local", (err, user, info) => {
            if (err) return res.status(500).json({ message: "Internal Server Error", error: err });
            if (!user) return res.status(401).json({ message: info.message });

            // Generate JWT Token
            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.SECRET_KEY
            );
    
            res.json({ token, message: "Login successful!" });
        })(req, res, next);
    });
    

    passport.use("local",
        new LocalStrategy({ usernameField: "email", passwordField: "password" },async function verify(email,password, cb) {
          try {
            const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
              email,
            ]);
            if (result.rows.length > 0) {
              const user = result.rows[0];
              const storedHashedPassword = user.password;
              bcrypt.compare(password, storedHashedPassword, (err, valid) => {
                if (err) {
                  //Error with password check
                  console.error("Error comparing passwords:", err);
                  return cb(err);
                } else {
                  if (valid) {
                    //Passed password check
                    console.log('validated')
                    return cb(null, user);
                  } else {
                    //Did not pass password check
                    return cb(null, false);
                  }
                }
              });
            } else {
              return cb("User not found");
            }
          } catch (err) {
            console.log(err);
          }
        })
      );
      
      passport.use("google",new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
      },
      async (accesToken,refreshToken,profile,cb)=>{
        console.log(profile); 
        try{
          const result=await db.query('SELECT * FROM users WHERE email=$1',[profile.emails[0].value])
          if(result.rows.length===0){
            const newUser=await db.query('INSERT INTO users(name,email,password) VALUES($1,$2,$3) RETURNING *',[profile.displayName,profile.emails[0].value,"google"])
            cb(null,newUser.rows[0]);
          }else{
            cb(null,result.rows[0])
          }
        }
        catch(err){
          cb(err)
        }
      }))
      
      
      passport.serializeUser((user, cb) => {
        cb(null, user);
      });
      passport.deserializeUser((user, cb) => {
        cb(null, user);
      });
      

    app.listen(port,()=>{
        console.log('Port 3000 is active')
    })