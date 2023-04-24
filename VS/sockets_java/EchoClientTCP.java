import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.Socket;
import java.util.Scanner;

public class EchoClientTCP {
    public static void main(String[] args) throws IOException {
        String hostName = "localhost";
        int portNumber = 8080;
        
        try (
            Socket echoSocket = new Socket(hostName, portNumber);
            PrintWriter out = new PrintWriter(echoSocket.getOutputStream(), true);
            BufferedReader in = new BufferedReader(new InputStreamReader(echoSocket.getInputStream()));
            Scanner scanner = new Scanner(System.in);
        ) {
            String userInput;
            do {
                System.out.print("Enter message (or 'quit' to exit): ");
                userInput = scanner.nextLine();
                out.println(userInput);
                String response = in.readLine();
                System.out.println("Server response: " + response);
            } while (!userInput.equals("quit"));
        } catch (IOException e) {
            System.out.println("Error connecting to server: " + e.getMessage());
        }
    }
}
