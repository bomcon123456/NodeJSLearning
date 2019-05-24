const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const Post = require("../models/post");

const { clearImage } = require("../util/file");

module.exports = {
  hello() {
    return "Hello";
  },
  createUser: ({ userInput }, req) => {
    const errors = [];
    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: "Email is invalid." });
    }
    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    ) {
      errors.push({ message: "Password is not invalid." });
    }
    if (errors.length > 0) {
      const error = new Error("Invalid input.");
      error.data = errors;
      error.code = 422;
      throw error;
    }
    return User.findOne({ email: userInput.email })
      .then(user => {
        if (user) {
          const error = new Error("User existed");
          throw error;
        }
        return bcrypt.hash(userInput.password, 12);
      })
      .then(hashedPw => {
        const user = new User({
          email: userInput.email,
          name: userInput.name,
          password: hashedPw
        });
        return user.save();
      })
      .then(user => {
        return { ...user._doc, _id: user._id.toString() };
      })
      .catch(err => {
        console.log(err);
      });
  },
  login({ email, password }, req) {
    let loggedinUser;
    return User.findOne({ email: email })
      .then(user => {
        if (!user) {
          const err = new Error("User not found.");
          err.code = 401;
          throw err;
        }
        loggedinUser = user;
        return bcrypt.compare(password, user.password);
      })
      .then(isEqual => {
        if (!isEqual) {
          const err = new Error("Password is incorrect.");
          err.code = 401;
          throw err;
        }
        const token = jwt.sign(
          {
            userId: loggedinUser._id.toString(),
            email: loggedinUser.email
          },
          "secret",
          { expiresIn: "1h" }
        );
        return {
          token: token,
          userId: loggedinUser._id.toString()
        };
      })
      .catch(err => {
        console.log(err);
      });
  },
  createPost({ postInput }, req) {
    if (!req.isAuth) {
      console.log("lele");
      const error = new Error("Not authenticated!");
      error.code = 401;
      throw error;
    }
    const errors = [];
    let loggedInUser;
    let localCreatedPost;
    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, { min: 5 })
    ) {
      errors.push({ message: "Title is not valid." });
    }
    if (
      validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content, { min: 5 })
    ) {
      errors.push({ message: "Content is not valid." });
    }
    if (errors.length > 0) {
      const error = new Error("Invalid input.");
      error.data = errors;
      error.code = 422;
      throw error;
    }
    return User.findById(req.userId)
      .then(user => {
        if (!user) {
          const error = new Error("Invalid user.");
          error.code = 401;
          throw error;
        }
        loggedInUser = user;
        const post = new Post({
          title: postInput.title,
          content: postInput.content,
          imageUrl: postInput.imageUrl,
          creator: user
        });
        return post.save();
      })
      .then(createdPost => {
        localCreatedPost = createdPost;
        loggedInUser.posts.push(createdPost);
        return loggedInUser.save();
      })
      .then(user => {
        return {
          ...localCreatedPost._doc,
          _id: localCreatedPost._id.toString(),
          createdAt: localCreatedPost.createdAt.toISOString(),
          updatedAt: localCreatedPost.updatedAt.toISOString()
        };
      })
      .catch(err => {
        console.log(err);
      });
  },
  posts: ({ page }, req) => {
    if (!req.isAuth) {
      const error = new Error("Not authenticated!");
      error.code = 401;
      throw error;
    }
    if (!page) {
      page = 1;
    }
    const perPage = 2;
    let localTotalPosts;
    return Post.find()
      .countDocuments()
      .then(totalPosts => {
        localTotalPosts = totalPosts;
        return Post.find()
          .sort({
            createdAt: -1
          })
          .skip((page - 1) * perPage)
          .limit(perPage)
          .populate("creator");
      })
      .then(posts => {
        return {
          posts: posts.map(p => {
            return {
              ...p._doc,
              _id: p._id.toString(),
              createdAt: p.createdAt.toISOString(),
              updatedAt: p.updatedAt.toISOString()
            };
          }),
          totalPosts: localTotalPosts
        };
      })
      .catch(err => {
        console.log(err);
      });
  },
  post: ({ id }, req) => {
    if (!req.isAuth) {
      const error = new Error("Not authenticated!");
      error.code = 401;
      throw error;
    }
    return Post.findById(id)
      .populate("creator")
      .then(post => {
        // console.log(post);
        if (!post) {
          const error = new Error("No posts found.");
          error.code = 404;
          throw error;
        }
        return {
          ...post._doc,
          _id: post._id.toString(),
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString()
        };
      })
      .catch(err => console.log(err));
  },
  updatePost: ({ id, postInput }, req) => {
    if (!req.isAuth) {
      const error = new Error("Not authenticated!");
      error.code = 401;
      throw error;
    }
    return Post.findById(id)
      .populate("creator")
      .then(post => {
        if (!post) {
          const error = new Error("No posts found.");
          error.code = 404;
          throw error;
        }
        if (post.creator._id.toString() !== req.userId.toString()) {
          const error = new Error("Not authorized!");
          error.code = 403;
          throw error;
        }
        let errors = [];
        if (
          validator.isEmpty(postInput.title) ||
          !validator.isLength(postInput.title, { min: 5 })
        ) {
          errors.push({ message: "Title is not valid." });
        }
        if (
          validator.isEmpty(postInput.content) ||
          !validator.isLength(postInput.content, { min: 5 })
        ) {
          errors.push({ message: "Content is not valid." });
        }
        if (errors.length > 0) {
          const error = new Error("Invalid input.");
          error.data = errors;
          error.code = 422;
          throw error;
        }
        post.title = postInput.title;
        post.content = postInput.content;
        console.log(postInput.imageUrl);
        if (postInput.imageUrl !== "undefined") {
          post.imageUrl = postInput.imageUrl;
        }
        return post.save();
      })
      .then(post => {
        return {
          ...post._doc,
          _id: post._id.toString(),
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString()
        };
      })
      .catch(err => console.log(err));
  },
  deletePost: ({ id }, req) => {
    if (!req.isAuth) {
      const error = new Error("Not authenticated!");
      error.code = 401;
      throw error;
    }
    return Post.findById(id)
      .then(post => {
        if (!post) {
          const error = new Error("No posts found.");
          error.code = 404;
          throw error;
        }
        if (post.creator.toString() !== req.userId.toString()) {
          const error = new Error("Not authorized!");
          error.code = 403;
          throw error;
        }
        clearImage(post.imageUrl);
        return Post.findByIdAndRemove(id);
      })
      .then(result => {
        return User.findById(req.userId);
      })
      .then(user => {
        user.posts.pull(id);
        return user.save();
      })
      .then(result => true)
      .catch(err => console.log(err));
  },
  user: async function(args, req) {
    if (!req.isAuth) {
      const error = new Error("Not authenticated!");
      error.code = 401;
      throw error;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("No user found.");
      error.code = 404;
      throw error;
    }
    return { ...user._doc, _id: user._id.toString() };
  },
  updateStatus: async function({ status }, req) {
    if (!req.isAuth) {
      const error = new Error("Not authenticated!");
      error.code = 401;
      throw error;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("No user found.");
      error.code = 404;
      throw error;
    }
    user.status = status;
    await user.save();
    return { ...user._doc, _id: user._id.toString() };
  }
};
