import React from "react";
import { motion } from "framer-motion";
import { LoginForm } from "../components/LoginForm";

const LoginPage: React.FC = () => {
  // Enhanced morphing variants with more dynamic movement
  const morphVariants = {
    animate: {
      borderRadius: [
        "60% 40% 30% 70% / 60% 30% 70% 40%",
        "30% 60% 70% 40% / 50% 60% 30% 60%",
        "60% 40% 30% 70% / 60% 30% 70% 40%",
      ],
      scale: [1, 1.1, 0.9, 1],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 15,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  // Enhanced text reveal with bouncy spring
  const textRevealVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.8,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        type: "spring",
        damping: 25,
        stiffness: 200,
      },
    },
  };

  // Card variants with 3D rotation
  const cardVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      rotateY: -30,
      y: 50,
    },
    visible: {
      opacity: 1,
      scale: 1,
      rotateY: 0,
      y: 0,
      transition: {
        duration: 1.2,
        type: "spring",
        damping: 20,
        stiffness: 100,
      },
    },
  };

  // Simplified floating animation to prevent performance issues
  const floatingVariants = {
    animate: {
      y: [0, -6, 0],
      transition: {
        duration: 4 + Math.random() * 2, // Variable duration
        repeat: Infinity,
        ease: "easeInOut",
        delay: Math.random() * 2,
      },
    },
  };

  // New particle animation for background
  const particleVariants = {
    animate: {
      y: [0, -100],
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeOut",
        delay: Math.random() * 3,
      },
    },
  };

  // Gradient text animation
  const gradientTextVariants = {
    animate: {
      backgroundPosition: ["0%", "100%", "0%"],
      scale: [1, 1.02, 1],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "linear",
      },
    },
  };

  // Stats counter animation
  const statsVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: 1.2 + i * 0.1,
        duration: 0.6,
        type: "spring",
        damping: 15,
        stiffness: 200,
      },
    }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 relative overflow-hidden scroll-smooth">
      {/* Animated background particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-orange-300 rounded-full opacity-30"
          style={{
            left: `${20 + i * 10}%`,
            top: `${30 + (i % 3) * 30}%`,
          }}
          variants={particleVariants}
          animate="animate"
        />
      ))}

      {/* Enhanced morphing background shapes */}
      <motion.div
        className="absolute top-20 right-20 w-80 h-80 bg-gradient-to-br from-orange-200 to-yellow-200 opacity-25"
        variants={morphVariants}
        animate="animate"
      />
      <motion.div
        className="absolute bottom-20 left-20 w-72 h-72 bg-gradient-to-br from-amber-200 to-orange-200 opacity-30"
        variants={morphVariants}
        animate="animate"
        transition={{ delay: 3 }}
      />

      {/* Additional floating shapes */}
      <motion.div
        className="absolute top-1/2 left-10 w-24 h-24 border-4 border-orange-300 rounded-full opacity-40"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Main container with responsive grid */}
      <div className="min-h-screen flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left content - spans 7 columns on large screens */}
            <motion.div
              className="lg:col-span-7 space-y-8"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.15,
                    delayChildren: 0.2,
                  },
                },
              }}
            >
              {/* Brand section with enhanced animation */}
              <motion.div variants={textRevealVariants}>
                <div className="flex items-center space-x-4 mb-6">
                  <motion.div
                    className="relative cursor-pointer"
                    whileHover={{
                      scale: 1.1,
                      rotate: 5,
                      transition: { duration: 0.3 },
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    {/* Logo with enhanced glow effect */}
                    <motion.div
                      className="h-14 w-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center"
                      animate={{
                        boxShadow: [
                          "0 0 20px rgba(234, 88, 12, 0.3)",
                          "0 0 30px rgba(234, 88, 12, 0.6)",
                          "0 0 20px rgba(234, 88, 12, 0.3)",
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <span className="text-white text-xl font-bold">BB</span>
                    </motion.div>
                    <motion.div
                      className="absolute inset-0 bg-orange-400 rounded-xl opacity-20 blur-lg"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.4, 0.2],
                        rotate: [0, 180, 360],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                  >
                    <h3 className="text-2xl font-bold text-gray-900">
                      BeatBudd
                    </h3>
                    <p className="text-sm text-gray-600">AI Music Assistant</p>
                  </motion.div>
                </div>
              </motion.div>

              {/* Main headline with enhanced gradient animation */}
              <motion.div variants={textRevealVariants} className="space-y-4">
                <motion.h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-tight">
                  <motion.span
                    className="block"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.8 }}
                  >
                    Find & Know
                  </motion.span>
                  <motion.span
                    className="block bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent"
                    style={{ backgroundSize: "200% 200%" }}
                    variants={gradientTextVariants}
                    animate="animate"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.8 }}
                  >
                    Your Music
                  </motion.span>
                </motion.h1>
              </motion.div>

              {/* Description with typewriter effect */}
              <motion.p
                variants={textRevealVariants}
                className="text-lg md:text-xl text-gray-700 leading-relaxed max-w-2xl"
                whileInView={{
                  scale: [0.98, 1.02, 1],
                  transition: { duration: 0.5 },
                }}
              >
                Our AI assistant provides song lyrics, helps identify tracks,
                and offers music knowledge to enhance your musical journey and
                discovery process.
              </motion.p>

              {/* Features grid with optimized animations */}
              <motion.div
                variants={textRevealVariants}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {[
                  {
                    icon: "📝",
                    title: "Get Lyrics",
                    desc: "Access lyrics for any song",
                  },
                  {
                    icon: "🔍",
                    title: "Identify Songs",
                    desc: "Find song names and artists",
                  },
                  {
                    icon: "💡",
                    title: "Music Knowledge",
                    desc: "Learn about tracks & artists",
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-orange-100 cursor-pointer group relative"
                    variants={floatingVariants}
                    animate="animate"
                    whileHover={{
                      scale: 1.05,
                      y: -8,
                      boxShadow: "0 20px 40px rgba(234, 88, 12, 0.15)",
                      backgroundColor: "rgba(255, 255, 255, 0.85)",
                      borderColor: "rgba(234, 88, 12, 0.2)",
                    }}
                    transition={{
                      duration: 0.3,
                      ease: "easeOut",
                    }}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    {/* Simplified icon animation */}
                    <motion.div
                      className="text-3xl mb-3"
                      whileHover={{
                        scale: 1.2,
                        transition: { duration: 0.3 },
                      }}
                    >
                      {feature.icon}
                    </motion.div>

                    <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors duration-300">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                      {feature.desc}
                    </p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Enhanced stats with counter animation */}
              <motion.div
                variants={textRevealVariants}
                className="flex flex-wrap gap-8 text-center md:text-left"
              >
                {[
                  { number: "100K+", label: "Songs in Database" },
                  { number: "50K+", label: "Happy Users" },
                  { number: "99%", label: "Accuracy Rate" },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    className="flex-1 min-w-32 cursor-pointer"
                    variants={statsVariants}
                    custom={index}
                    whileHover={{
                      scale: 1.1,
                      rotate: 5,
                      transition: { duration: 0.3 },
                    }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <motion.div
                      className="text-3xl font-bold text-orange-600"
                      animate={{
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.5,
                      }}
                    >
                      {stat.number}
                    </motion.div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right content - Login form with 3D effects */}
            <motion.div
              className="lg:col-span-5 w-full max-w-md mx-auto"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50"
                whileHover={{
                  scale: 1.01,
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {/* Form header with enhanced animations */}
                <motion.div
                  className="text-center mb-8 relative z-10"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
                >
                  <motion.div
                    className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full mb-6"
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    whileHover={{
                      scale: 1.2,
                      transition: { duration: 0.3 },
                    }}
                  >
                    <span className="text-2xl">🎶</span>
                  </motion.div>
                  <motion.h2
                    className="text-2xl font-bold text-gray-900 mb-2"
                    animate={{
                      color: ["#111827", "#EA580C", "#111827"],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    Start Exploring
                  </motion.h2>
                  <p className="text-gray-600">
                    Sign in to access lyrics and music knowledge
                  </p>
                </motion.div>

                {/* Login form with slide-in animation */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1, duration: 0.6 }}
                  className="relative z-10"
                >
                  <LoginForm />
                </motion.div>

                {/* Footer with enhanced privacy link */}
                <motion.div
                  className="mt-8 pt-6 border-t border-gray-200 text-center relative z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                >
                  <p className="text-xs text-gray-500">
                    Protected by industry-standard encryption.{" "}
                    <motion.a
                      href="#"
                      className="text-orange-600 hover:text-orange-700 underline cursor-pointer"
                      whileHover={{
                        scale: 1.05,
                        color: "#EA580C",
                        transition: { duration: 0.2 },
                      }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      Privacy Policy
                    </motion.a>
                  </p>
                </motion.div>
              </motion.div>

              {/* Optimized floating action hint */}
              <motion.div
                className="text-center mt-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.5 }}
              >
                <motion.div
                  className="inline-flex items-center space-x-2 text-gray-500 text-sm"
                  animate={{
                    y: [0, -6, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  whileHover={{
                    scale: 1.1,
                    color: "#EA580C",
                    transition: { duration: 0.3 },
                  }}
                >
                  <motion.span
                    animate={{
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    🎵
                  </motion.span>

                  <span>Your music companion awaits</span>

                  <motion.span
                    animate={{
                      rotate: [0, -10, 10, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5,
                    }}
                  >
                    🎵
                  </motion.span>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Enhanced bottom wave with multiple layers */}
      <div className="absolute bottom-0 left-0 w-full">
        <svg viewBox="0 0 1440 120" className="w-full h-32">
          <motion.path
            d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z"
            fill="rgba(234, 88, 12, 0.15)"
            animate={{
              d: [
                "M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z",
                "M0,80 C240,40 480,80 720,40 C960,0 1200,80 1440,40 L1440,120 L0,120 Z",
                "M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z",
              ],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path
            d="M0,80 C240,120 480,40 720,80 C960,120 1200,40 1440,80 L1440,120 L0,120 Z"
            fill="rgba(251, 191, 36, 0.1)"
            animate={{
              d: [
                "M0,80 C240,120 480,40 720,80 C960,120 1200,40 1440,80 L1440,120 L0,120 Z",
                "M0,100 C240,60 480,100 720,60 C960,20 1200,100 1440,60 L1440,120 L0,120 Z",
                "M0,80 C240,120 480,40 720,80 C960,120 1200,40 1440,80 L1440,120 L0,120 Z",
              ],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />
        </svg>
      </div>
    </div>
  );
};

export default LoginPage;
