# SimplexFlow AI Visualizer (单纯形法AI可视化)

An interactive, step-by-step visualizer for the Linear Programming Simplex method, featuring AI-powered explanations and a modern aesthetic.

## Features

- **Step-by-Step Visualization**: Watch the simplex tableau evolve as the algorithm progresses.
- **AI Insights**: Get natural language explanations of each step using Google Gemini or DeepSeek.
- **Interactive Problem Input**: Define your own maximization problems or generate random ones.
- **Optimization Path**: Track the objective value Z across iterations with a dynamic chart.
- **Responsive Design**: Works on desktop and mobile.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/simplexflow-ai-visualizer.git
   cd simplexflow-ai-visualizer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Deployment to GitHub Pages

This project is configured for easy deployment to GitHub Pages using GitHub Actions.

1. Push your code to a GitHub repository.
2. Go to **Settings > Pages**.
3. Under **Build and deployment > Source**, select **GitHub Actions**.
4. The deployment will happen automatically on every push to the `main` branch.

## License

MIT
