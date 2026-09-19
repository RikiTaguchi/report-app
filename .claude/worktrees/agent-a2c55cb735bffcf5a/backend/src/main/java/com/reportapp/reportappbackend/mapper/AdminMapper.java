package com.reportapp.reportappbackend.mapper;

import com.reportapp.reportappbackend.entity.Admin;
import java.util.Optional;
import org.apache.ibatis.annotations.Param;

public interface AdminMapper {

    Optional<Admin> findByUsername(@Param("username") String username);
}
