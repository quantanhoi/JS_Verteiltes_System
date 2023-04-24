import java.io.IOException;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.util.Scanner;

public class EchoClient {
    public static void main(String[] args) {
        final int PORT = 8080;
        Scanner scanner = new Scanner(System.in);
        byte[] buffer = new byte[1024];

        try (DatagramSocket socket = new DatagramSocket()) {
            InetAddress serverAddress = InetAddress.getByName("localhost");
            while (true) {
                System.out.print("Enter message (or 'quit' to exit): ");
                String message = scanner.nextLine();
                if ("quit".equals(message)) {
                    break;
                }
                DatagramPacket request = new DatagramPacket(message.getBytes(), message.length(),
                        serverAddress, PORT);
                socket.send(request);
                DatagramPacket response = new DatagramPacket(buffer, buffer.length);
                socket.receive(response);
                String echoMessage = new String(response.getData(), 0, response.getLength());
                System.out.println("Received echo: " + echoMessage);
            }
        } catch (IOException e) {
            System.err.println("Error in echo client: " + e.getMessage());
        }
    }
}
