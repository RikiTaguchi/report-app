package com.reportapp.reportappbackend.entity;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class Admin extends BaseEntity {

    private String username;

    private String passwordHash;

    private String name;
}
