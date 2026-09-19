package com.reportapp.reportappbackend;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@MapperScan("com.reportapp.reportappbackend.mapper")
@SpringBootApplication
public class ReportAppBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(ReportAppBackendApplication.class, args);
	}

}
