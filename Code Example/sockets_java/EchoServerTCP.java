import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.ServerSocket;
import java.net.Socket;

public class EchoServerTCP {
    public static void main(String[] args) throws IOException {
        int portNumber = 8080;
        
        try (ServerSocket serverSocket = new ServerSocket(portNumber)) {
            System.out.println("Echo server listening on port " + portNumber);
            while (true) {
                Socket clientSocket = serverSocket.accept();
                System.out.println("Client connected: " + clientSocket.getInetAddress());
                
                try (
                    PrintWriter out = new PrintWriter(clientSocket.getOutputStream(), true);
                    BufferedReader in = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
                ) {
                    String inputLine;
                    while ((inputLine = in.readLine()) != null) {
                        System.out.println("Received message from client: " + inputLine);
                        out.println(inputLine);
                    }
                } catch (IOException e) {
                    System.out.println("Error handling client: " + e.getMessage());
                }
                
                System.out.println("Client disconnected: " + clientSocket.getInetAddress());
            }
        } catch (IOException e) {
            System.out.println("Could not listen on port " + portNumber);
        }
    }
}
