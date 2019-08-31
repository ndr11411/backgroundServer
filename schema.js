const userModel = require('./models/userModel')
const categoriesModel = require('./models/categoriesModel')
const photosModel = require('./models/photosModel')
const { gql } = require('apollo-server-express')
const jsonwebtoken = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const typeDefs = gql`
  type User {
    _id: ID
    avatar: String
    name: String
    email: String
    isPremium: Boolean
  }

  type Photo {
    _id: ID
    name: String
    tiempo: Int
    dificultad: String
    categoryId: Int
    src: String
    likes: Int
    liked: Boolean
    rating: Int
    userId: ID
  }

  type Category {
    _id: ID
    cover: String
    name: String
    emoji: String
    path: String
  }

  type Query {
    favs: [Photo]
    categories: [Category]
    photos(categoryId: ID): [Photo],
    photo(_id: ID!): Photo
  }

  input LikePhoto {
    _id: ID!
  }

  input UserCredentials {
    email: String!
    password: String!
  }

  type Mutation {
    likeAnonymousPhoto (input: LikePhoto!): Photo
    likePhoto (input: LikePhoto!): Photo
    signup (input: UserCredentials!): String
    login (input: UserCredentials!): String
  }
`

function checkIsUserLogged (context) {
  const { email, _id } = context
  // check if the user is logged
  if (!_id) throw new Error('you must be logged in to perform this action')
  // find the user and check if it exists
  const user = userModel.find({ email })
  // if user doesnt exist, throw an error
  if (!user) throw new Error('user does not exist')
  return user
}

function tryGetFavsFromUserLogged (context) {
  try {
    const { email } = checkIsUserLogged(context)
    const user = userModel.find({ email })
    return user.favs
  } catch (e) {
    return []
  }
}

const resolvers = {
  Mutation: {
    likeAnonymousPhoto: (_, { input }) => {
      // find the photo by id and throw an error if it doesn't exist
      const { _id: photoId } = input
      const photo = photosModel.find({ _id: photoId })
      if (!photo) {
        throw new Error(`Couldn't find photo with _id ${photoId}`)
      }
      // put a like to the photo
      photosModel.addLike({ _id: photoId })
      // get the updated photos model
      const actualPhoto = photosModel.find({ _id: photoId })
      return actualPhoto
    },
    likePhoto: (_, { input }, context) => {
      const { _id: userId } = checkIsUserLogged(context)

      // find the photo by id and throw an error if it doesn't exist
      const { _id: photoId } = input
      const photo = photosModel.find({ _id: photoId })
      if (!photo) {
        throw new Error(`Couldn't find photo with _id ${photoId}`)
      }

      const hasFav = userModel.hasFav({ _id: userId, photoId })

      if (hasFav) {
        photosModel.removeLike({ _id: photoId })
        userModel.removeFav({ _id: userId, photoId })
      } else {
        // put a like to the photo and add the like to the user database
        photosModel.addLike({ _id: photoId })
        userModel.addFav({ _id: userId, photoId })
      }

      // get favs from user before exiting
      const favs = tryGetFavsFromUserLogged(context)
      // get the updated photos model
      const actualPhoto = photosModel.find({ _id: photoId, favs })

      return actualPhoto
    },
    // Handle user signup
    async signup (_, { input }) {
      // add 1 second of delay in order to see loading stuff
      await new Promise(resolve => setTimeout(resolve, 1000))

      const { email, password } = input

      const user = await userModel.find({ email })

      if (user) {
        throw new Error('User already exists')
      }

      const newUser = await userModel.create({
        email,
        password
      })

      // return json web token
      return jsonwebtoken.sign(
        { _id: newUser._id, email: newUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '1y' }
      )
    },

    // Handles user login
    async login (_, { input }) {
      // add 1 second of delay in order to see loading stuff
      await new Promise(resolve => setTimeout(resolve, 1000))

      const { email, password } = input
      const user = await userModel.find({ email })

      if (!user) {
        throw new Error('No user with that email')
      }

      const valid = await bcrypt.compare(password, user.password)

      if (!valid) {
        throw new Error('Incorrect password')
      }

      // return json web token
      return jsonwebtoken.sign(
        { _id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      )
    }
  },
  Query: {
    favs (_, __, context) {
      const { email } = checkIsUserLogged(context)
      const { favs } = userModel.find({ email })
      return photosModel.list({ ids: favs, favs })
    },
    categories () {
      return categoriesModel.list()
    },
    photo (_, { _id }, context) {
      const favs = tryGetFavsFromUserLogged(context)
      return photosModel.find({ id, favs })
    },
    photos (_, { categoryId }, context) {
      const favs = tryGetFavsFromUserLogged(context)
      return photosModel.list({ categoryId, favs })
    }
  }
}

module.exports = { typeDefs, resolvers }
