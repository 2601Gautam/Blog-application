// Import required modules
import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = 3000;
const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Store users and blogs in memory
const users = {};
let blogs = [];

const dummyBlogs = [
  {
    title: "The Future of AI",
    tags: "AI, Technology",
    content: "AI is changing the world rapidly. From automation to creativity...",
    p_date: "2025-05-11"
  },
  {
    title: "Exploring Nature",
    tags: "Travel, Nature",
    content: "Wandering through the lush green valleys was a life-changing experience...",
    p_date: "2025-05-10"
  },
  {
    title: "Learning Web Development",
    tags: "Coding, JavaScript",
    content: "JavaScript is the backbone of interactive web experiences...",
    p_date: "2025-05-09"
  },
  {
    title: "Mental Health Matters",
    tags: "Health, Awareness",
    content: "Taking care of mental health is just as important as physical fitness...",
    p_date: "2025-05-08"
  },
  {
    title: "Gadget Reviews 2025",
    tags: "Tech, Reviews",
    content: "Here’s what’s new and trending in the gadget world this year...",
    p_date: "2025-05-07"
  },
  {
    title: "Cooking with Love",
    tags: "Food, Recipes",
    content: "Today we’re exploring simple but delicious homemade recipes...",
    p_date: "2025-05-06"
  },
  {
    title: "Fitness on a Budget",
    tags: "Fitness, Lifestyle",
    content: "No gym? No problem. You can stay fit with these basic routines...",
    p_date: "2025-05-05"
  },
  {
    title: "Books That Changed My Life",
    tags: "Books, Inspiration",
    content: "Some books leave an unforgettable mark on your soul. Here's my list...",
    p_date: "2025-05-04"
  },
  {
    title: "Minimalist Living",
    tags: "Lifestyle, Simplicity",
    content: "Decluttering your space can declutter your mind. Here's how I did it...",
    p_date: "2025-05-03"
  },
  {
    title: "Student Life Tips",
    tags: "Education, Motivation",
    content: "Balancing studies and social life can be tough, but here's what works...",
    p_date: "2025-05-02"
  }
];


// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "yourSecretKey",
    resave: false,
    saveUninitialized: true,
  })
);

// Middleware to protect routes
function isLoggedIn(req, res, next) {
  if (!req.session.user || !req.session.user.email) {
    return res.redirect("/sign_in");
  }
  next();
}

// Routes
app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/create", isLoggedIn, (req, res) => {
  const isEdit = req.query.edit === "true";
  const blogToEdit = isEdit && req.session.latestBlogIndex === 0 ? blogs[0] : null;
  res.render("create.ejs", { blog: blogToEdit, editMode: isEdit });
});

app.post("/create", isLoggedIn, (req, res) => {
  const blogData = {
    title: req.body["title"],
    content: req.body["content"],
    tags: req.body["tags"],
    summary: req.body["excerpt"],
    p_date: req.body["publish_date"],
    author: req.session.user.email,
  };

  if (req.session.latestBlogIndex === 0 && blogs.length > 0) {
    blogs[0] = blogData;
  } else {
    blogs.unshift(blogData);
    req.session.latestBlogIndex = 0;
  }

  res.render("options.ejs", { latestBlog: blogData });
});

app.get("/browsepost", (req, res) => {
  res.render("browsepost.ejs", {
    blogs: blogs,
    userEmail: req.session.user ? req.session.user.email : null,
    dummy_blogs: dummyBlogs,
  });
});

app.post("/delete/:index", isLoggedIn, (req, res) => {
  const index = parseInt(req.params.index);
  if (
    !isNaN(index) &&
    index >= 0 &&
    index < blogs.length &&
    blogs[index].author === req.session.user.email
  ) {
    blogs.splice(index, 1);
  }
  res.redirect("/browsepost");
});

app.get("/edit", isLoggedIn, (req, res) => {
  const index = req.session.latestBlogIndex;
  if (index === undefined || index !== 0) {
    return res.send("Edit not allowed. You can only edit your latest blog.");
  }

  const blogToEdit = blogs[0];
  res.render("edit.ejs", { blog: blogToEdit });
});

app.post("/edit", isLoggedIn, (req, res) => {
  const index = req.session.latestBlogIndex;
  if (index !== 0) {
    return res.send("Editing old blog is not allowed.");
  }

  blogs[0] = {
    title: req.body["title"],
    content: req.body["content"],
    tags: req.body["tags"],
    summary: req.body["excerpt"],
    p_date: req.body["publish_date"],
    author: req.session.user.email,
  };

  res.redirect("/browsepost");
});

app.get("/about", (req, res) => {
  res.render("about.ejs");
});

// Prevent multiple logins
app.get("/sign_in", (req, res) => {
  if (req.session.user) return res.redirect("/create");
  res.render("sign_in.ejs", { error: null });
});

app.post("/sign_in", (req, res) => {
  const { email, password } = req.body;
  const user = users[email];

  if (!user || user.password !== password) {
    return res.render("sign_in.ejs", { error: "Invalid credentials. Please try again." });
  }

  req.session.user = { email };
  res.redirect("/create");
});

app.get("/sign_up", (req, res) => {
  if (req.session.user) return res.redirect("/create");
  res.render("sign_up.ejs");
});

app.post("/sign_up", (req, res) => {
  const { username, email, password, confirm_password } = req.body;
  if (password !== confirm_password) {
    return res.send("Passwords do not match.");
  }

  if (users[email]) {
    return res.send("Account already exists. Please sign in.");
  }

  users[email] = { password };
  req.session.user = { email };
  res.redirect("/create");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
});
