package com.reportapp.reportappbackend.entity;

import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class Student extends BaseEntity {

    private String username;

    private String passwordHash;

    private String lastName;

    private String firstName;

    private UUID teacherId;

    private String profileImageUrl;

    public String getName() {
        return lastName + firstName;
    }
}
