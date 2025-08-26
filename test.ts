// Import Libs
import glfw from "glfw-n-api";
import gl from "nodegl";
// Setup Code
async function main() {
	// Init GLFW
	if (!glfw.glfwInit()) {
		glfw.glfwTerminate();
		process.exit(1);
	}
	// Define Constants
	const WINDOW_WIDTH = 600;
	const WINDOW_HEIGHT = 600;
	// Create Window
	const window = glfw.glfwCreateWindow(
		WINDOW_WIDTH,
		WINDOW_HEIGHT,
		"OpenGLNode",
		null,
		null
	);
	if (!window) {
		glfw.glfwTerminate();
		process.exit(1);
	}
	// Get Buffer Size
	glfw.glfwSetFramebufferSizeCallback(window, (window, fbW, fbH) => {
		gl.glViewport(0, 0, fbW, fbH);
		gl.glMatrixMode(gl.GL_PROJECTION);
		gl.glLoadIdentity();
	});
	// Set Current GL Context
	glfw.glfwMakeContextCurrent(window);
	// Pre Loop
	gl.glClearColor(0.0, 0.0, 0.0, 1.0);
	gl.glMatrixMode(gl.GL_PROJECTION);
	gl.glLoadIdentity();
	gl.glOrtho(-15.0, 15.0, -15.0, 15.0, -15.0, 15.0);
	// Main
	while (!glfw.glfwWindowShouldClose(window)) {
		// Check Window Events
		glfw.glfwPollEvents();
		// Clear the screen
		gl.glClear(gl.GL_COLOR_BUFFER_BIT);
		// Draw a blue square
		gl.glBegin(gl.GL_QUADS);
		gl.glColor3d(0.0, 0.0, 1.0);
		gl.glVertex3d(-3.0, -3.0, 0.0);
		gl.glVertex3d(3.0, -3.0, 0.0);
		gl.glVertex3d(3.0, 3.0, 0.0);
		gl.glVertex3d(-3.0, 3.0, 0.0);
		gl.glEnd();
		// Draw - End
		glfw.glfwSwapBuffers(window);
		gl.glFlush();
	}
	// Deallocate GLFW Context
	glfw.glfwTerminate();
	// Exit Program
	process.exit(0);
}
// Start
main();