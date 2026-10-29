package com.hospital.isolation.repository;

import com.hospital.isolation.model.UtilityValve;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UtilityValveRepository extends JpaRepository<UtilityValve, Long> {
    Optional<UtilityValve> findByValveCode(String valveCode);
}
