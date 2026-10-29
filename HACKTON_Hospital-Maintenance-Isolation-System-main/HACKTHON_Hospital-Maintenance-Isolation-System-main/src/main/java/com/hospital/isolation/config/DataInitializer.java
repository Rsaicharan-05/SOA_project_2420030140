package com.hospital.isolation.config;

import com.hospital.isolation.model.*;
import com.hospital.isolation.repository.IsolationRequestRepository;
import com.hospital.isolation.repository.RoomRepository;
import com.hospital.isolation.repository.UserRepository;
import com.hospital.isolation.repository.UtilityValveRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final UtilityValveRepository valveRepository;
    private final IsolationRequestRepository isolationRequestRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           RoomRepository roomRepository,
                           UtilityValveRepository valveRepository,
                           IsolationRequestRepository isolationRequestRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
        this.valveRepository = valveRepository;
        this.isolationRequestRepository = isolationRequestRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        initializeUsers();
        initializeHospitalTopology();
    }

    private void initializeUsers() {
        if (userRepository.count() == 0) {
            userRepository.save(new User(
                    "engineer",
                    passwordEncoder.encode("password123"),
                    Role.ROLE_ENGINEER,
                    "James Henderson (Lead Estates & Biomedical Engineer)"
            ));

            userRepository.save(new User(
                    "supervisor1",
                    passwordEncoder.encode("password123"),
                    Role.ROLE_WARD_SUPERVISOR,
                    "Sister Sarah Jenkins (ICU & Critical Care Matron)"
            ));

            userRepository.save(new User(
                    "supervisor2",
                    passwordEncoder.encode("password123"),
                    Role.ROLE_WARD_SUPERVISOR,
                    "David Miller (Theatre Coordinator & Surgical Sister)"
            ));

            userRepository.save(new User(
                    "supervisor3",
                    passwordEncoder.encode("password123"),
                    Role.ROLE_WARD_SUPERVISOR,
                    "Dr. Elena Rostova (Pediatrics & Dialysis Charge Nurse)"
            ));
        }
    }

    private void initializeHospitalTopology() {
        if (roomRepository.count() == 0 && valveRepository.count() == 0) {
            // ==========================================
            // Authentic Hospital Departments & Clinical Rooms
            // ==========================================

            // 1. Intensive Care Unit (ICU) - Floor 2, Wing A
            Room icu101 = roomRepository.save(new Room("ICU Bed 101", "Intensive Care Unit (ICU)", "Negative Pressure Isolation Bay"));
            Room icu102 = roomRepository.save(new Room("ICU Bed 102", "Intensive Care Unit (ICU)", "High-Dependency Ventilated Bed"));
            Room icu103 = roomRepository.save(new Room("ICU Bed 103", "Intensive Care Unit (ICU)", "Post-Cardiac Surgery Critical Bed"));

            // 2. Neonatal Intensive Care Unit (NICU) - Floor 2, Wing B
            Room nicu201 = roomRepository.save(new Room("NICU Pod 201", "Neonatal Intensive Care (NICU)", "Isolette Incubator Station A"));
            Room nicu202 = roomRepository.save(new Room("NICU Pod 202", "Neonatal Intensive Care (NICU)", "High-Risk Preterm Neonate Pod B"));

            // 3. Operating Theatres & PACU Recovery - Floor 1, Surgical Block
            Room or1 = roomRepository.save(new Room("OR Suite 1", "Operating Theatre Block", "Cardiac & Thoracic Main Theatre"));
            Room or2 = roomRepository.save(new Room("OR Suite 2", "Operating Theatre Block", "Emergency Trauma & Orthopaedic Theatre"));
            Room pacu = roomRepository.save(new Room("PACU Bay 1", "Post-Anesthesia Care (PACU)", "Immediate Post-Op Extubation Bay"));

            // 4. Emergency & Acute Trauma Resus - Ground Floor
            Room resus1 = roomRepository.save(new Room("Resus Bay 1", "Emergency & Trauma Centre", "Adult Advanced Cardiac Life Support Bay"));
            Room resus2 = roomRepository.save(new Room("Resus Bay 2", "Emergency & Trauma Centre", "Major Trauma & Shock Resuscitation Bay"));

            // 5. Renal Dialysis Unit - Floor 3, North Wing
            Room renal301 = roomRepository.save(new Room("Dialysis Station 1", "Renal Dialysis Centre", "Acute Hemodialysis Station with Reverse Osmosis"));
            Room renal302 = roomRepository.save(new Room("Dialysis Station 2", "Renal Dialysis Centre", "Inpatient Peritoneal Dialysis Room"));

            // 6. Pediatric Inpatient Ward - Floor 3, South Wing
            Room peds401 = roomRepository.save(new Room("Pediatric Room 401", "Pediatric Inpatient Ward", "Pediatric High-Dependency Bed"));
            Room peds402 = roomRepository.save(new Room("Pediatric Room 402", "Pediatric Inpatient Ward", "Pediatric General Care Room"));

            // 7. Maternity & Delivery Suites - Floor 4
            Room mat501 = roomRepository.save(new Room("Delivery Suite 1", "Maternity & Labor Ward", "High-Risk Birthing Suite with Entonox"));
            Room mat502 = roomRepository.save(new Room("Postnatal Room 502", "Maternity & Labor Ward", "Postnatal Mother & Baby Room"));

            // ==========================================
            // Multi-Ward Isolation Valves
            // ==========================================

            // Valve 0: Medical Oxygen - ICU East Wing
            UtilityValve valveO2East = new UtilityValve(
                    "VALVE-O2-EAST",
                    "MEDICAL_OXYGEN",
                    "Building A - Floor 2 - Service Shaft East",
                    "Primary oxygen supply isolation valve for ICU East Wing"
            );
            valveO2East.addRoom(icu101);
            valveO2East.addRoom(icu102);
            valveO2East.addRoom(icu103);
            valveRepository.save(valveO2East);

            // Valve 1: Multi-Ward Critical Oxygen Main (Spans ICU + NICU + Emergency Resus)
            UtilityValve valveO2Critical = new UtilityValve(
                    "VALVE-O2-CRITICAL-ZONE",
                    "MEDICAL_OXYGEN",
                    "Service Shaft 2A (Inter-Floor Riser between Ground & Floor 2)",
                    "Main 4-Bar Liquid Oxygen Supply Line serving ICU, NICU, and Emergency Trauma Resus"
            );
            valveO2Critical.addRoom(icu101);
            valveO2Critical.addRoom(icu102);
            valveO2Critical.addRoom(nicu201);
            valveO2Critical.addRoom(resus1);
            valveRepository.save(valveO2Critical);

            // Valve 2: Surgical Suction/Medical Vacuum (Spans Operating Theatres + PACU + Emergency Resus)
            UtilityValve valveVacSurg = new UtilityValve(
                    "VALVE-VAC-SURG-BLOCK",
                    "MEDICAL_VACUUM",
                    "Surgical Block Basement Tunnel B-14",
                    "High-volume surgical suction pipeline for OR 1, OR 2, PACU Recovery, and Trauma Resus 2"
            );
            valveVacSurg.addRoom(or1);
            valveVacSurg.addRoom(or2);
            valveVacSurg.addRoom(pacu);
            valveVacSurg.addRoom(resus2);
            valveRepository.save(valveVacSurg);

            // Valve 3: Multi-Ward Potable & Treated Water Main (Spans Renal Dialysis + Maternity + Pediatrics)
            UtilityValve valveWaterMulti = new UtilityValve(
                    "VALVE-WAT-RISER-EAST",
                    "TREATED_WATER",
                    "East Wing Mechanical Plant Room - Riser 3",
                    "Domestic and Reverse-Osmosis water feed to Renal Dialysis, Maternity Suites, and Pediatrics"
            );
            valveWaterMulti.addRoom(renal301);
            valveWaterMulti.addRoom(renal302);
            valveWaterMulti.addRoom(mat501);
            valveWaterMulti.addRoom(peds401);
            valveRepository.save(valveWaterMulti);

            // Valve 4: Medical Breathing Air (Air-4 / 400 kPa Life Support)
            UtilityValve valveAirGas = new UtilityValve(
                    "VALVE-AIR-GAS-MANIFOLD",
                    "MEDICAL_AIR_400KPA",
                    "Central Medical Gas Plant Room - Manifold Riser 4",
                    "Medical Breathing Air (400 kPa) for ICU mechanical ventilators and OR Anaesthetic workstations"
            );
            valveAirGas.addRoom(or1);
            valveAirGas.addRoom(icu103);
            valveAirGas.addRoom(mat501);
            valveRepository.save(valveAirGas);

            // Valve 5: Nitrous Oxide & Entonox Analgesia (N2O/O2 50:50)
            UtilityValve valveN2O = new UtilityValve(
                    "VALVE-N2O-ENTONOX-ZONE",
                    "ENTONOX_ANALGESIA",
                    "Maternity Service Corridor - Valve Enclosure M-02",
                    "Entonox and N2O analgesic gas supply line to Delivery Birthing Suites and Main Theatres"
            );
            valveN2O.addRoom(mat501);
            valveN2O.addRoom(mat502);
            valveN2O.addRoom(or1);
            valveRepository.save(valveN2O);

            // Valve 6: Negative-Pressure Cleanroom HVAC & HEPA Extraction
            UtilityValve valveHvac = new UtilityValve(
                    "VALVE-HVAC-HEPA-ISOLATION",
                    "NEGATIVE_PRESSURE_HVAC",
                    "Roof Plant Room C - Isolation Air Handling Unit AHU-04",
                    "HEPA extraction and differential pressure control for Airborne Infectious Disease Isolation"
            );
            valveHvac.addRoom(icu101);
            valveHvac.addRoom(peds401);
            valveRepository.save(valveHvac);

            // ==========================================
            // Pre-Seed 2 Active Concurrent Isolation Workflows
            // Showing Multi-Ward status in different stages
            // ==========================================

            // Active Request 1: Surgical Vacuum Maintenance (Affects OR 1, OR 2, PACU, Resus 2)
            // Shows 3 rooms acknowledged, 1 still pending (OR 2)!
            IsolationRequest reqSurgical = new IsolationRequest(
                    "ISO-2026-001",
                    valveVacSurg,
                    "Mandatory safety inspection & gasket replacement on central surgical suction line",
                    "engineer"
            );

            RoomAcknowledgement ackOr1 = new RoomAcknowledgement(reqSurgical, or1);
            ackOr1.setAcknowledged(true);
            ackOr1.setAcknowledgedAt(LocalDateTime.now().minusHours(2));
            ackOr1.setAcknowledgedBy("David Miller");
            ackOr1.setNotes("Theatre 1 cases rescheduled; suction bottles switched to portable mobile suction unit");

            RoomAcknowledgement ackPacu = new RoomAcknowledgement(reqSurgical, pacu);
            ackPacu.setAcknowledged(true);
            ackPacu.setAcknowledgedAt(LocalDateTime.now().minusHours(1));
            ackPacu.setAcknowledgedBy("David Miller");
            ackPacu.setNotes("PACU patients extubated and transferred to Step-down Ward; mobile suction standby");

            RoomAcknowledgement ackResus2 = new RoomAcknowledgement(reqSurgical, resus2);
            ackResus2.setAcknowledged(true);
            ackResus2.setAcknowledgedAt(LocalDateTime.now().minusMinutes(45));
            ackResus2.setAcknowledgedBy("Dr. Elena Rostova");
            ackResus2.setNotes("Trauma cases diverted to Resus Bay 1; mobile aspirator confirmed on resuscitation trolley");

            RoomAcknowledgement ackOr2 = new RoomAcknowledgement(reqSurgical, or2);
            ackOr2.setAcknowledged(false); // PENDING! Still undergoing emergency trauma case!

            reqSurgical.addAcknowledgement(ackOr1);
            reqSurgical.addAcknowledgement(ackOr2);
            reqSurgical.addAcknowledgement(ackPacu);
            reqSurgical.addAcknowledgement(ackResus2);
            isolationRequestRepository.save(reqSurgical);

            // Active Request 2: Dialysis & Water Riser Maintenance
            // Multi-Ward affecting Renal + Maternity + Pediatrics (All pending)
            IsolationRequest reqWater = new IsolationRequest(
                    "ISO-2026-002",
                    valveWaterMulti,
                    "Sterilization of East Riser backflow preventer and pressure reducing valve",
                    "engineer"
            );
            reqWater.addAcknowledgement(new RoomAcknowledgement(reqWater, renal301));
            reqWater.addAcknowledgement(new RoomAcknowledgement(reqWater, renal302));
            reqWater.addAcknowledgement(new RoomAcknowledgement(reqWater, mat501));
            reqWater.addAcknowledgement(new RoomAcknowledgement(reqWater, peds401));
            isolationRequestRepository.save(reqWater);
        }
    }
}
