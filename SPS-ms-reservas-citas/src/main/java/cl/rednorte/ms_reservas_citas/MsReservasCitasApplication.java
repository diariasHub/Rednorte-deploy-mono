package cl.rednorte.ms_reservas_citas;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class MsReservasCitasApplication {

	public static void main(String[] args) {
		SpringApplication.run(MsReservasCitasApplication.class, args);
	}

}
