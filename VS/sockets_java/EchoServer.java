import java.io.IOException;
import java.net.DatagramPacket;
import java.net.DatagramSocket;

public class EchoServer {
    public static void main(String[] args) {
        final int PORT = 8080;
        byte[] buffer = new byte[1024];

        try (DatagramSocket socket = new DatagramSocket(PORT)) {
            System.out.println("Echo server started on port " + PORT);
            while (true) {
                DatagramPacket request = new DatagramPacket(buffer, buffer.length);
                socket.receive(request);
                String message = new String(request.getData(), 0, request.getLength());
                System.out.println("Received message: " + message);
                DatagramPacket response = new DatagramPacket(request.getData(), request.getLength(),
                        request.getAddress(), request.getPort());
                socket.send(response);
            }
        } catch (IOException e) {
            System.err.println("Error in echo server: " + e.getMessage());
        }
    }
}
