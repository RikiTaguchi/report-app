package com.reportapp.reportappbackend.entity;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class Teacher extends BaseEntity {

    private String username;

    private String passwordHash;

    private String lastName;

    private String firstName;

    public String getName() {
        return lastName + firstName;
    }
}
